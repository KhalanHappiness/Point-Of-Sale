"""add_min_max_price_columns

Revision ID: b244306ee7b3
Revises: 6a94291dfada
Create Date: 2026-01-25 00:07:06.471352

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.

revision = 'b244306ee7b3'
down_revision = '6a94291dfada'
branch_labels = None
depends_on = None


def upgrade():
    # Step 1: Add columns as NULLABLE first
    op.add_column('products', sa.Column('min_price', sa.Numeric(precision=10, scale=2), nullable=True))
    op.add_column('products', sa.Column('max_price', sa.Numeric(precision=10, scale=2), nullable=True))
    
    # Step 2: Copy existing price data to both new columns
    op.execute('UPDATE products SET min_price = price, max_price = price WHERE price IS NOT NULL')
    
    # Step 3: Make columns NOT NULL
    op.alter_column('products', 'min_price', nullable=False)
    op.alter_column('products', 'max_price', nullable=False)
    
    # Step 4: Drop old price column
    op.drop_column('products', 'price')


def downgrade():
    # Add price column back
    op.add_column('products', sa.Column('price', sa.Numeric(precision=10, scale=2), nullable=True))
    
    # Copy max_price back to price (or you could use min_price or average)
    op.execute('UPDATE products SET price = max_price WHERE max_price IS NOT NULL')
    
    # Make price NOT NULL
    op.alter_column('products', 'price', nullable=False)
    
    # Drop the new columns
    op.drop_column('products', 'max_price')
    op.drop_column('products', 'min_price')