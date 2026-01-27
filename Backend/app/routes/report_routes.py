"""
Report Routes
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.extensions import db
from app.models.sale import Sale, SaleItem
from app.models.product import Product
from app.utils.permissions import require_role
from sqlalchemy import func
from datetime import datetime, timedelta

report_bp = Blueprint('reports', __name__)


@report_bp.route('/daily', methods=['GET'])
@jwt_required()
@require_role('admin')
def daily_sales_report():
    """
    Get daily sales report
    
    Query params:
        days: int (default 7) - number of days to include
    
    Returns:
        {
            "report": [
                {
                    "date": "string",
                    "total_sales": number,
                    "transaction_count": int,
                    "cash": number,
                    "card": number,
                    "mobile": number
                },
                ...
            ]
        }
    """
    try:
        days = request.args.get('days', 7, type=int)
        
        # Get date range
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        # Query sales grouped by date and payment method
        results = db.session.query(
            func.date(Sale.created_at).label('date'),
            Sale.payment_method,
            func.sum(Sale.total_amount).label('total'),
            func.count(Sale.id).label('count')
        ).filter(
            Sale.created_at >= start_date
        ).group_by(
            func.date(Sale.created_at),
            Sale.payment_method
        ).all()
        
        # Organize by date
        daily_data = {}
        for row in results:
            date_str = row.date.isoformat()
            if date_str not in daily_data:
                daily_data[date_str] = {
                    'date': date_str,
                    'total_sales': 0,
                    'transaction_count': 0,
                    'cash': 0,
                    'card': 0,
                    'mobile': 0
                }
            
            daily_data[date_str]['total_sales'] += float(row.total)
            daily_data[date_str]['transaction_count'] += row.count
            daily_data[date_str][row.payment_method] = float(row.total)
        
        # Convert to list and sort by date
        report = sorted(daily_data.values(), key=lambda x: x['date'], reverse=True)
        
        return jsonify({'report': report}), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to generate report'}), 500


@report_bp.route('/products', methods=['GET'])
@jwt_required()
@require_role('admin')
def product_performance_report():
    """
    Get product performance report
    
    Query params:
        days: int (default 30) - number of days to include
        limit: int (default 20) - top N products
    
    Returns:
        {
            "report": [
                {
                    "product_id": int,
                    "product_name": "string",
                    "units_sold": int,
                    "revenue": number
                },
                ...
            ]
        }
    """
    try:
        days = request.args.get('days', 30, type=int)
        limit = request.args.get('limit', 20, type=int)
        
        # Get date range
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        # Query top selling products
        results = db.session.query(
            Product.id,
            Product.name,
            func.sum(SaleItem.quantity).label('units_sold'),
            func.sum(SaleItem.quantity * SaleItem.price_at_sale).label('revenue')
        ).join(
            SaleItem, Product.id == SaleItem.product_id
        ).join(
            Sale, SaleItem.sale_id == Sale.id
        ).filter(
            Sale.created_at >= start_date
        ).group_by(
            Product.id,
            Product.name
        ).order_by(
            func.sum(SaleItem.quantity * SaleItem.price_at_sale).desc()
        ).limit(limit).all()
        
        report = []
        for row in results:
            report.append({
                'product_id': row.id,
                'product_name': row.name,
                'units_sold': int(row.units_sold),
                'revenue': float(row.revenue)
            })
        
        return jsonify({'report': report}), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to generate report'}), 500


@report_bp.route('/payments', methods=['GET'])
@jwt_required()
@require_role('admin')
def payment_method_report():
    """
    Get payment method breakdown
    
    Query params:
        days: int (default 30) - number of days to include
    
    Returns:
        {
            "report": {
                "cash": {
                    "total": number,
                    "transaction_count": int,
                    "percentage": number
                },
                "card": {...},
                "mobile": {...}
            },
            "total": number,
            "total_transactions": int
        }
    """
    try:
        days = request.args.get('days', 30, type=int)
        
        # Get date range
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        # Query payment methods
        results = db.session.query(
            Sale.payment_method,
            func.sum(Sale.total_amount).label('total'),
            func.count(Sale.id).label('count')
        ).filter(
            Sale.created_at >= start_date
        ).group_by(
            Sale.payment_method
        ).all()
        
        # Calculate totals
        grand_total = sum(float(row.total) for row in results)
        total_transactions = sum(row.count for row in results)
        
        # Build report
        report = {}
        for row in results:
            total_amount = float(row.total)
            percentage = (total_amount / grand_total * 100) if grand_total > 0 else 0
            
            report[row.payment_method] = {
                'total': total_amount,
                'transaction_count': row.count,
                'percentage': round(percentage, 2)
            }
        
        return jsonify({
            'report': report,
            'total': grand_total,
            'total_transactions': total_transactions
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to generate report'}), 500
    
@report_bp.route('/cashiers', methods=['GET'])
@jwt_required()
@require_role('admin')
def cashier_sales_report():
    """
    Get sales report per cashier with payment breakdown
    Query params: days (default 7)
    """
    try:
        days = request.args.get('days', 7, type=int)
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)

        # Aggregate sales per cashier and payment method
        results = db.session.query(
            Sale.user_id,
            Sale.payment_method,
            func.sum(Sale.total_amount).label('total'),
            func.count(Sale.id).label('count')
        ).filter(
            Sale.created_at >= start_date
        ).group_by(
            Sale.user_id,
            Sale.payment_method
        ).all()

        # Build report
        from app.models.user import User
        cashier_data = {}

        for row in results:
            if row.user_id not in cashier_data:
                user = db.session.query(User).filter_by(id=row.user_id).first()
                cashier_data[row.user_id] = {
                    'cashier_id': row.user_id,
                    'cashier_name': user.username if user else 'Unknown',
                    'total_sales': 0,
                    'transaction_count': 0,
                    'cash': 0,
                    'card': 0,
                    'mobile': 0
                }

            cashier_data[row.user_id]['total_sales'] += float(row.total)
            cashier_data[row.user_id]['transaction_count'] += row.count
            cashier_data[row.user_id][row.payment_method] = float(row.total)

        report = sorted(cashier_data.values(), key=lambda x: x['total_sales'], reverse=True)

        return jsonify({'report': report}), 200

    except Exception as e:
        return jsonify({'error': f'Failed to generate cashier report: {str(e)}'}), 500
