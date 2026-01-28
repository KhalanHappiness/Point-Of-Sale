# app/routes/brand_routes.py
"""
Brand Routes
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.services.brand_service import BrandService
from app.utils.permissions import require_role

brand_bp = Blueprint('brands', __name__)


@brand_bp.route('', methods=['GET'])
@jwt_required()
def get_brands():
    """Get all brands"""
    try:
        active_only_param = request.args.get('active_only', 'true')
        active_only = active_only_param.lower() in ['true', '1', 'yes']
        
        brands = BrandService.get_all_brands(active_only=active_only)
        
        return jsonify({
            'brands': [b.to_dict() for b in brands]
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch brands'}), 500


@brand_bp.route('', methods=['POST'])
@jwt_required()
@require_role('admin')
def create_brand():
    """Create new brand (Admin only)"""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    try:
        brand = BrandService.create_brand(
            name=data.get('name'),
            description=data.get('description')
        )
        
        return jsonify({'brand': brand.to_dict()}), 201
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@brand_bp.route('/<int:brand_id>', methods=['PUT'])
@jwt_required()
@require_role('admin')
def update_brand(brand_id):
    """Update brand (Admin only)"""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    try:
        brand = BrandService.update_brand(brand_id, **data)
        return jsonify({'brand': brand.to_dict()}), 200
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@brand_bp.route('/<int:brand_id>', methods=['DELETE'])
@jwt_required()
@require_role('admin')
def delete_brand(brand_id):
    """Delete brand (Admin only)"""
    try:
        BrandService.delete_brand(brand_id)
        return jsonify({'message': 'Brand deleted successfully'}), 200
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 404
    except Exception as e:
        return jsonify({'error': 'Brand deletion failed'}), 500