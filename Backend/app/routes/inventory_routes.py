"""
Inventory Routes
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.inventory import Inventory
from app.models.product import Product
from app.models.stock_movement import StockMovement
from app.utils.permissions import require_role

inventory_bp = Blueprint('inventory', __name__)


@inventory_bp.route('', methods=['GET'])
@jwt_required()
def get_inventory():
    """
    Get all inventory levels
    
    Returns:
        {
            "inventory": [
                {
                    "product": {object},
                    "quantity": int
                },
                ...
            ]
        }
    """
    try:
        inventories = db.session.query(Inventory).join(Product).filter(
            Product.is_active == True
        ).all()
        
        result = []
        for inv in inventories:
            result.append({
                'product': inv.product.to_dict(include_inventory=False),
                'quantity': inv.quantity,
                'updated_at': inv.updated_at.isoformat() if inv.updated_at else None
            })
        
        return jsonify({'inventory': result}), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch inventory'}), 500


@inventory_bp.route('/adjust', methods=['POST'])
@jwt_required()
@require_role('admin')
def adjust_inventory():
    """
    Adjust inventory (Admin only)
    
    Request body:
        {
            "product_id": int,
            "change": int (positive or negative),
            "reason": "restock" | "adjustment" | "damage",
            "notes": "string" (optional)
        }
    
    Returns:
        {
            "inventory": {object},
            "movement": {object}
        }
    """
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    product_id = data.get('product_id')
    change = data.get('change')
    reason = data.get('reason')
    notes = data.get('notes')
    
    if not product_id or change is None or not reason:
        return jsonify({'error': 'product_id, change, and reason are required'}), 400
    
    if reason not in ['restock', 'adjustment', 'damage']:
        return jsonify({'error': 'Invalid reason'}), 400
    
    try:
        user_id = get_jwt_identity()
        
        # Get inventory
        inventory = db.session.query(Inventory).filter_by(
            product_id=product_id
        ).with_for_update().first()
        
        if not inventory:
            return jsonify({'error': 'Product inventory not found'}), 404
        
        # Check if adjustment would make quantity negative
        new_quantity = inventory.quantity + change
        if new_quantity < 0:
            return jsonify({
                'error': f'Invalid adjustment. Current: {inventory.quantity}, Change: {change}'
            }), 400
        
        # Update inventory
        inventory.quantity = new_quantity
        
        # Create stock movement
        movement = StockMovement(
            product_id=product_id,
            change=change,
            reason=reason,
            user_id=user_id,
            notes=notes
        )
        db.session.add(movement)
        
        db.session.commit()
        
        return jsonify({
            'inventory': inventory.to_dict(),
            'movement': movement.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Inventory adjustment failed: {str(e)}'}), 500


@inventory_bp.route('/movements', methods=['GET'])
@jwt_required()
@require_role('admin')
def get_stock_movements():
    """
    Get stock movement history (Admin only)
    
    Query params:
        product_id: int (optional)
        limit: int (default 100)
    
    Returns:
        {
            "movements": [array]
        }
    """
    try:
        product_id = request.args.get('product_id', type=int)
        limit = request.args.get('limit', 100, type=int)
        
        query = db.session.query(StockMovement)
        
        if product_id:
            query = query.filter_by(product_id=product_id)
        
        movements = query.order_by(
            StockMovement.created_at.desc()
        ).limit(limit).all()
        
        return jsonify({
            'movements': [m.to_dict() for m in movements]
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch movements'}), 500