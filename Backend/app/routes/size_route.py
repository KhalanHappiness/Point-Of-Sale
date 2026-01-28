# app/routes/size_routes.py
"""
Size Routes
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.services.size_service import SizeService
from app.utils.permissions import require_role

size_bp = Blueprint('sizes', __name__)


@size_bp.route('', methods=['GET'])
@jwt_required()
def get_sizes():
    """Get all sizes"""
    try:
        active_only_param = request.args.get('active_only', 'true')
        active_only = active_only_param.lower() in ['true', '1', 'yes']
        
        sizes = SizeService.get_all_sizes(active_only=active_only)
        
        return jsonify({
            'sizes': [s.to_dict() for s in sizes]
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch sizes'}), 500


@size_bp.route('', methods=['POST'])
@jwt_required()
@require_role('admin')
def create_size():
    """Create new size (Admin only)"""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    try:
        size = SizeService.create_size(
            name=data.get('name'),
            description=data.get('description')
        )
        
        return jsonify({'size': size.to_dict()}), 201
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@size_bp.route('/<int:size_id>', methods=['PUT'])
@jwt_required()
@require_role('admin')
def update_size(size_id):
    """Update size (Admin only)"""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    try:
        size = SizeService.update_size(size_id, **data)
        return jsonify({'size': size.to_dict()}), 200
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@size_bp.route('/<int:size_id>', methods=['DELETE'])
@jwt_required()
@require_role('admin')
def delete_size(size_id):
    """Delete size (Admin only)"""
    try:
        SizeService.delete_size(size_id)
        return jsonify({'message': 'Size deleted successfully'}), 200
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 404
    except Exception as e:
        return jsonify({'error': 'Size deletion failed'}), 500