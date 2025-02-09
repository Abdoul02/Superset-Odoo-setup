from odoo import http
from odoo.http import request

class DashboardController(http.Controller):
    _name = 'custom.dashboardController'
    _description = 'Custom Dashboard Controller'

    @http.route('/custom_dashboard/data', type='json', auth='user')
    def fetch_dashboard_data(self):
        """Fetch sales & quantity data for the dashboard graph."""
        data = request.env['custom.dashboard'].sudo().fetch_dashboard_data()
        return data
