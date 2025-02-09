/** @odoo-module **/
import { registry } from "@web/core/registry";
import { useService } from "@web/core/utils/hooks";
import { Component, onMounted, useState } from "@odoo/owl";
import { DashboardGraph } from "./dashboard_graph";

const supersetUrl = "http://localhost:8088"; // Update with your Superset URL
const supersetApiUrl = `${supersetUrl}/api/v1/security`;
const dashboardId = "3fd3d920-28f3-425f-bf1e-b781c47322a6";

class CustomDashboard extends Component {
    static template = "custom_dashboard.DashboardMain"; // Explicitly set the template
    static components = { DashboardGraph };

    setup() {
        this.orm = useService("orm");
        this.state = useState({
            labels: [], sales: [], quantities: [],
            countries: [], customers: [], products: [],
            selectedCountry: "", selectedCustomer: "", selectedProduct: "",
            supersetToken: ""
        });
        this.onFilterChange = this.onFilterChange.bind(this);
        this.setState = (newState) => {
            this.state = { ...this.state, ...newState };
        };

        this.fetchFilters();
        this.fetchDashboardData();
        this.loadSupersetDashboard();

        onMounted(async () => {
            this.loadSupersetSDK();
            await this.waitForChartJS();
            setTimeout(() => this.renderChart(), 500); // Delay to ensure DOM is ready
        });
    }

    async loadSupersetSDK() {
      if (window.supersetEmbeddedSdk) { // Check for the correct global variable
        console.log("Superset SDK already loaded.");
        return;
      }

      return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://unpkg.com/@superset-ui/embedded-sdk";
        script.async = true;
        script.onload = () => {
          console.log("Superset SDK loaded. Initializing...");
          // Access the SDK via window.supersetEmbeddedSdk
          window.embedDashboard = window.supersetEmbeddedSdk.embedDashboard; // Assign to a global
          resolve();
        };
        script.onerror = () => {
           console.error("Failed to load Superset SDK.");
           reject(new Error("Failed to load Superset SDK"));
        };
        document.head.appendChild(script);
      });
    }

    async getToken() {
        try {
            // Step 1: Fetch CSRF Token
            const csrfResponse = await fetch(`${supersetApiUrl}/csrf_token/`, {
                method: "GET",
                credentials: "include", // Ensures cookies are sent & stored
            });

            if (!csrfResponse.ok) {
                throw new Error(`CSRF token fetch failed with status ${csrfResponse.status}`);
            }

            const csrfData = await csrfResponse.json();
            console.log("CSRF Token Response:", csrfData);

            // Handle both possible response formats
            const csrfToken = csrfData.result || csrfData.csrf_token;
            if (!csrfToken) {
                throw new Error("CSRF token not found in response");
            }

            // Step 2: Fetch Access Token (Include CSRF Token)
            const loginBody = {
                "password": "admin",
                "provider": "db",
                "refresh": true,
                "username": "admin"
            };

            const loginResponse = await fetch(`${supersetApiUrl}/login`, {
                method: "POST",
                body: JSON.stringify(loginBody),
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": csrfToken // Include CSRF token
                },
                credentials: "include" // Ensure session cookie is sent
            });

            if (!loginResponse.ok) {
                throw new Error(`Login failed with status ${loginResponse.status}`);
            }

            const loginData = await loginResponse.json();
            console.log("Login response:", loginData);

            const accessToken = loginData.access_token;
            if (!accessToken) {
                throw new Error("Access token not found in login response");
            }

            // Step 3: Fetch Guest Token (Include CSRF Token)
            const guestTokenBody = JSON.stringify({
                "resources": [{ "type": "dashboard", "id": dashboardId }],
                "user": { "username": "odoo_dashboard", "first_name": "Guest", "last_name": "User" },
                "rls": []
            });

            const guestResponse = await fetch(`${supersetApiUrl}/guest_token/`, {
                method: "POST",
                body: guestTokenBody,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${accessToken}`,
                    "X-CSRFToken": csrfToken // Ensure CSRF token is included
                },
                credentials: "include" // Ensure session cookie is sent
            });

            if (!guestResponse.ok) {
                const errorData = await guestResponse.json(); // Read response body
                console.log("Guest token error response:", errorData);
                throw new Error(`Guest token fetch failed with status ${guestResponse.status}: ${errorData.message || "Unknown error"}`);
            }

            const guestData = await guestResponse.json();
            console.log("Guest token response:", guestData);

            this.state.supersetToken = guestData.token;
            console.log("Guest token obtained:", this.state.supersetToken);
        } catch (error) {
            console.error("Error in getToken:", error);
            alert(`Failed to authenticate with Superset: ${error.message}`);
        }
    }

    async loadSupersetDashboard() {
            await this.getToken(); // Get the guest token first
            console.log("Loading Superset SDK...");
            await this.loadSupersetSDK(); // Ensure SDK is loaded before using it

            if (!window.embedDashboard) {
                console.error("Superset SDK still not loaded!");
                return;
            }

            console.log("Embedding Superset Dashboard with token:", this.state.supersetToken);

            const mountPoint = document.getElementById("superset-container");
            if (!mountPoint) {
                console.error("Superset container not found!");
                return;
            }

            window.embedDashboard({
                id: dashboardId,
                supersetDomain: supersetUrl,
                mountPoint: mountPoint,
                fetchGuestToken: () => this.state.supersetToken,
                dashboardUiConfig: {
                    filters: { expanded: true },
                    urlParams: { standalone: 2 }
                }
            });
    }

    async fetchFilters() {
    const result = await this.orm.call("custom.dashboard", "fetch_filters", [], {});

    // Helper function to extract a string from a multilingual object
    function getName(nameObj) {
        if (typeof nameObj === "object" && nameObj !== null) {
            // Return the 'en_US' value if available, otherwise the first available value
            return nameObj.en_US || Object.values(nameObj)[0] || "";
        }
        return String(nameObj);
    }

    this.state.countries = result.countries.map(country => ({
        id: String(country.id),
        name: getName(country.name)
    }));
    this.state.customers = result.customers.map(customer => ({
        id: String(customer.id),
        name: getName(customer.name)
    }));
    this.state.products = result.products.map(product => ({
        id: String(product.id),
        name: getName(product.name)
    }));
}


    async fetchDashboardData() {
        const result = await this.orm.call("custom.dashboard", "fetch_dashboard_data", [
            this.state.selectedCountry,
            this.state.selectedCustomer,
            this.state.selectedProduct
        ], {});
        this.state.labels = result.labels;
        this.state.sales = result.sales;
        this.state.quantities = result.quantities;
        this.renderChart();
    }

    onFilterChange(field, value) {
        this.setState({ [field]: value });
        this.fetchDashboardData();
    }

    async waitForChartJS() {
        let retries = 10;
        while (typeof window.Chart === "undefined" && retries > 0) {
            console.warn("Chart.js is not available yet. Retrying...");
            await new Promise((resolve) => setTimeout(resolve, 300));
            retries--;
        }

        if (typeof window.Chart === "undefined") {
            console.error("Chart.js failed to load.");
        } else {
            console.log("Chart.js is now available.");
        }
    }

    renderChart() {
        console.log("Attempting to render chart...");
        const canvas = document.querySelector("#salesChart");

        if (!canvas) {
            console.error("salesChart element not found! Delaying render...");
            setTimeout(() => this.renderChart(), 500);
            return;
        }

        if (!window.Chart) {
            console.error("Chart.js is not loaded.");
            return;
        }

        const ctx = canvas.getContext("2d");

        // Destroy existing chart instance if present
        if (this.chartInstance) {
            this.chartInstance.destroy();
        }

        this.chartInstance = new window.Chart(ctx, {
            type: "bar",
            data: {
                labels: this.state.labels,
                datasets: [
                    {
                        label: "Total Sales ($)",
                        data: this.state.sales,
                        backgroundColor: "rgba(54, 162, 235, 0.6)",
                        borderColor: "rgba(54, 162, 235, 1)",
                        borderWidth: 1,
                        type: "line",
                        yAxisID: "y1",
                        tension: 0.4, // <-- Add this property for a smooth curve
                    },
                    {
                        label: "Quantity Sold",
                        data: this.state.quantities,
                        backgroundColor: "rgba(255, 99, 132, 0.6)",
                        borderColor: "rgba(255, 99, 132, 1)",
                        borderWidth: 1,
                        yAxisID: "y2",
                    },
                ],
            },
            options: {
                responsive: true,
                scales: {
                    y1: { position: "left", beginAtZero: true },
                    y2: { position: "right", beginAtZero: true, grid: { drawOnChartArea: false } },
                },
            },
        });
    }

}

registry.category("actions").add("custom_dashboard", CustomDashboard);
