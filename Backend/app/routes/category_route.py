# app/routes/category_routes.py
"""
Category Routes
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.services.category_service import CategoryService
from app.utils.permissions import require_role

category_bp = Blueprint('categories', __name__)


@category_bp.route('', methods=['GET'])
@jwt_required()
def get_categories():
    """
    Get all categories
    
    Query params:
        active_only: bool (default True)
    
    Returns:
        {
            "categories": [array]
        }
    """
    try:
        active_only_param = request.args.get('active_only', 'true')
        active_only = active_only_param.lower() in ['true', '1', 'yes']
        
        categories = CategoryService.get_all_categories(active_only=active_only)
        
        return jsonify({
            'categories': [c.to_dict() for c in categories]
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch categories'}), 500


@category_bp.route('', methods=['POST'])
@jwt_required()
@require_role('admin')
def create_category():
    """
    Create new category (Admin only)
    
    Request body:
        {
            "name": "string",
            "description": "string" (optional)
        }
    
    Returns:
        {
            "category": {object}
        }
    """
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    try:
        category = CategoryService.create_category(
            name=data.get('name'),
            description=data.get('description')
        )
        
        return jsonify({'category': category.to_dict()}), 201
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@category_bp.route('/<int:category_id>', methods=['PUT'])
@jwt_required()
@require_role('admin')
def update_category(category_id):
    """
    Update category (Admin only)
    
    Request body:
        {
            "name": "string" (optional),
            "description": "string" (optional),
            "is_active": bool (optional)
        }
    
    Returns:
        {
            "category": {object}
        }
    """
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    try:
        category = CategoryService.update_category(category_id, **data)
        return jsonify({'category': category.to_dict()}), 200
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@category_bp.route('/<int:category_id>', methods=['DELETE'])
@jwt_required()
@require_role('admin')
def delete_category(category_id):
    """
    Delete category (Admin only) - Soft delete
    
    Returns:
        {
            "message": "Category deleted successfully"
        }
    """
    try:
        CategoryService.delete_category(category_id)
        return jsonify({'message': 'Category deleted successfully'}), 200
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 404
    except Exception as e:
        return jsonify({'error': 'Category deletion failed'}), 500