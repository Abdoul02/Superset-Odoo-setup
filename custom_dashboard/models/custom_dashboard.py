from odoo import models, fields, api

class CustomDashboard(models.Model):
    _name = 'custom.dashboard'
    _description = 'Custom Dashboard'

    name = fields.Char(string="Name")
    total_sales = fields.Float(string="Total Sales")
    total_quantity = fields.Float(string="Total Quantity")

    @api.model
    def fetch_dashboard_data(self, selected_country="", selected_customer="", selected_product=""):
        """ Fetch monthly sales and quantity data with optional filters """
        params = {}
        filters = []

        if selected_country:
            filters.append("p.country_id = %(selected_country)s")
            params["selected_country"] = int(selected_country)  # Assuming country is stored as an ID

        if selected_customer:
            filters.append("s.partner_id = %(selected_customer)s")
            params["selected_customer"] = int(selected_customer)  # Assuming customer is stored as an ID

        if selected_product:
            filters.append("l.product_id = %(selected_product)s")
            params["selected_product"] = int(selected_product)  # Assuming product is stored as an ID

        filter_clause = " AND " + " AND ".join(filters) if filters else ""

        query = f"""
            SELECT 
                TO_CHAR(s.date_order, 'YYYY-MM') as month,
                SUM(l.product_uom_qty) as total_quantity,
                SUM(l.price_total) as total_sales
            FROM sale_order_line l
            JOIN sale_order s ON l.order_id = s.id
            JOIN res_partner p ON s.partner_id = p.id
            WHERE s.state IN ('sale', 'done') {filter_clause}
            GROUP BY month
            ORDER BY month ASC
        """

        self._cr.execute(query, params)
        result = self._cr.fetchall()

        return {
            "labels": [row[0] for row in result],  # Month labels
            "quantities": [row[1] for row in result],  # Total quantity sold
            "sales": [row[2] for row in result],  # Total sales amount
        }

    @api.model
    def fetch_filters(self):
        """ Fetch unique countries, customers, and products for filters """
        self._cr.execute("SELECT DISTINCT id, name FROM res_country ORDER BY name")
        countries = [{"id": row[0], "name": row[1]} for row in self._cr.fetchall()]

        self._cr.execute("SELECT DISTINCT id, name FROM res_partner ORDER BY name")
        customers = [{"id": row[0], "name": row[1]} for row in self._cr.fetchall()]

        self._cr.execute("SELECT DISTINCT id, name FROM product_template ORDER BY name")
        products = [{"id": row[0], "name": row[1]} for row in self._cr.fetchall()]

        return {
            "countries": countries,
            "customers": customers,
            "products": products,
        }
