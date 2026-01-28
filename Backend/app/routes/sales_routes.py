# app/routes/sales_routes.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.sales_service import SalesService

sales_bp = Blueprint('sales', __name__)


@sales_bp.route('', methods=['POST'])
@jwt_required()
def create_sale():
    """
    Create a new sale (CRITICAL ENDPOINT - TRANSACTION SAFE)
    
    Request body:
        {
            "items": [
                {
                    "variant_id": int,
                    "quantity": int,
                    "price": float
                },
                ...
            ],
            "payment_method": "cash" | "card" | "mobile"
        }
    
    Returns:
        {
            "sale": {object with items}
        }
    """
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    items = data.get('items', [])
    payment_method = data.get('payment_method')
    
    if not items:
        return jsonify({'error': 'Items are required'}), 400
    
    if not payment_method:
        return jsonify({'error': 'Payment method is required'}), 400
    
    try:
        user_id = get_jwt_identity()
        
        sale = SalesService.create_sale(
            user_id=user_id,
            items_data=items,
            payment_method=payment_method
        )
        
        return jsonify({'sale': sale.to_dict(include_items=True)}), 201
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@sales_bp.route('', methods=['GET'])
@jwt_required()
def get_sales():
    """
    Get all sales with pagination
    
    Query params:
        limit: int (default 100)
        offset: int (default 0)
    
    Returns:
        {
            "sales": [array],
            "count": int
        }
    """
    try:
        limit = request.args.get('limit', 100, type=int)
        offset = request.args.get('offset', 0, type=int)
        
        sales = SalesService.get_all_sales(limit=limit, offset=offset)
        
        return jsonify({
            'sales': [sale.to_dict() for sale in sales],
            'count': len(sales)
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch sales'}), 500


@sales_bp.route('/<int:sale_id>', methods=['GET'])
@jwt_required()
def get_sale(sale_id):
    """
    Get a single sale with items
    
    Returns:
        {
            "sale": {object with items}
        }
    """
    try:
        sale = SalesService.get_sale(sale_id)
        
        if not sale:
            return jsonify({'error': 'Sale not found'}), 404
        
        return jsonify({'sale': sale.to_dict(include_items=True)}), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch sale'}), 500