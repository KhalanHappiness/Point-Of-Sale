# app/routes/inventory_routes.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.inventory_service import InventoryService
from app.utils.permissions import require_role

inventory_bp = Blueprint('inventory', __name__)


@inventory_bp.route('', methods=['GET'])
@jwt_required()
def get_inventory():
    """
    Get all inventory levels (all product variants)
    
    Returns:
        {
            "inventory": [
                {
                    "variant": {object},
                    "product": {object},
                    "size": {object},
                    "quantity": int
                },
                ...
            ]
        }
    """
    try:
        variants = InventoryService.get_all_inventory(active_products_only=True)
        
        result = []
        for variant in variants:
            result.append({
                'variant_id': variant.id,
                'product': variant.product.to_dict(include_variants=False) if variant.product else None,
                'size': variant.size.to_dict() if variant.size else None,
                'quantity': variant.quantity,
                'full_sku': variant.to_dict()['full_sku'],
                'updated_at': variant.updated_at.isoformat() if variant.updated_at else None
            })
        
        return jsonify({'inventory': result}), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch inventory'}), 500


@inventory_bp.route('/adjust', methods=['POST'])
@jwt_required()
@require_role('admin')
def adjust_inventory():
    """
    Adjust inventory for a variant (Admin only)
    
    Request body:
        {
            "variant_id": int,
            "change": int (positive or negative),
            "reason": "restock" | "adjustment" | "damage",
            "notes": "string" (optional)
        }
    
    Returns:
        {
            "variant": {object},
            "movement": {object}
        }
    """
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    variant_id = data.get('variant_id')
    change = data.get('change')
    reason = data.get('reason')
    notes = data.get('notes')
    
    if not variant_id or change is None or not reason:
        return jsonify({'error': 'variant_id, change, and reason are required'}), 400
    
    if reason not in ['restock', 'adjustment', 'damage']:
        return jsonify({'error': 'Invalid reason'}), 400
    
    try:
        user_id = get_jwt_identity()
        
        variant = InventoryService.adjust_variant_inventory(
            variant_id=variant_id,
            change=change,
            reason=reason,
            user_id=user_id,
            notes=notes
        )
        
        # Get the latest movement
        movements = InventoryService.get_stock_movements(variant_id=variant_id, limit=1)
        movement = movements[0] if movements else None
        
        return jsonify({
            'variant': variant.to_dict(),
            'movement': movement.to_dict() if movement else None
        }), 200
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': f'Inventory adjustment failed: {str(e)}'}), 500


@inventory_bp.route('/movements', methods=['GET'])
@jwt_required()
@require_role('admin')
def get_stock_movements():
    """
    Get stock movement history (Admin only)
    
    Query params:
        variant_id: int (optional)
        product_id: int (optional)
        limit: int (default 100)
    
    Returns:
        {
            "movements": [array]
        }
    """
    try:
        variant_id = request.args.get('variant_id', type=int)
        product_id = request.args.get('product_id', type=int)
        limit = request.args.get('limit', 100, type=int)
        
        movements = InventoryService.get_stock_movements(
            variant_id=variant_id,
            product_id=product_id,
            limit=limit
        )
        
        return jsonify({
            'movements': [m.to_dict() for m in movements]
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch movements'}), 500