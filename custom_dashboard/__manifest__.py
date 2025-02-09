# noinspection PyStatementEffect
{
    'name': 'Custom Dashboard',
    'version': '1.0',
    'summary': 'Enhanced Dashboard for Business Insights',
    'description': 'A better dashboard with custom widgets and analytics.',
    'author': 'Your Company',
    'sequence': 1,
    'depends': ['base', 'sale', 'web'],
    'data': [
        'security/ir.model.access.csv',
        'views/actions.xml',
        'views/menus.xml',
        'views/assets.xml',
        'views/dashboard_views.xml'
    ],
    'assets': {
        'web.assets_backend': [
            'custom_dashboard/static/lib/chart.umd.js',
            'custom_dashboard/static/src/icons/chart.png',
            'custom_dashboard/static/src/xml/dashboard.xml',
            'custom_dashboard/static/src/css/dashboard.css',
            'custom_dashboard/static/src/js/dashboard.js',
            'custom_dashboard/static/src/js/dashboard_graph.js',
        ],
    },
    'installable': True,
    'application': True,
    'license': 'LGPL-3'
}
