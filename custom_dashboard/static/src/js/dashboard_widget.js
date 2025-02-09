odoo.define('custom_dashboard.Widget', function (require) {
    "use strict";

    const AbstractAction = require('web.AbstractAction');
    const core = require('web.core');
    const QWeb = core.qweb;  // Import QWeb to render templates

    const DashboardWidget = AbstractAction.extend({
        template: 'CustomDashboardWidget',  // Reference the QWeb template

        start: function () {
            console.log("Dashboard Widget Loaded");
            // You can use this method to render dynamic content
        },
    });

    core.action_registry.add('custom_dashboard_widget', DashboardWidget);
});
