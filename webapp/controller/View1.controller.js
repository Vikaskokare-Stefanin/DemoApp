sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/Table",
    "sap/m/Column",
    "sap/m/Text",
    "sap/m/ColumnListItem",
    "sap/m/SearchField",
    "sap/m/HBox",
    "sap/m/VBox",
    "sap/m/List",
    "sap/m/CustomListItem",
    "sap/f/Avatar",
    "sap/m/DatePicker",
    "sap/m/Input",
    "sap/m/TextArea",
    "sap/m/Label",
    "sap/m/Select",
    "sap/ui/core/Item",
    "sap/ui/core/Icon"
], function (Controller, JSONModel, MessageToast, MessageBox, Dialog, Button, Table, Column, Text, ColumnListItem, SearchField, HBox, VBox, List, CustomListItem, Avatar, DatePicker, Input, TextArea, Label, Select, CoreItem, Icon) {
    "use strict";

    return Controller.extend("aiproject.controller.View1", {
        onInit: function () {
            // ----------------------------------------------------
            // DATA FLOW: LOCAL STATE MODEL
            // Contains UI properties (e.g. active tab, active nav view, target values).
            // Updates to this model instantly propagates to the UI controls via XML binding,
            // such as: saudaValue -> '{localState>/saudaValue}'
            // ----------------------------------------------------
            this.oLocalModel = new JSONModel({
                selectedDistributor: "all",
                activeTab: "Sauda",
                activePeriod: "MTD",
                activeNav: "Home", // Keeps track of bottom navigation
                
                // Sauda card details
                saudaValue: "0 MT",
                saudaTarget: "0 MT Target",
                saudaPercent: 0,
                saudaWeeks: [],
                
                // Sales card details
                salesValue: "0 MT",
                salesTarget: "0 MT Target",
                salesPercent: 0,
                salesWeeks: [],
                
                // Expired / Dues values
                expiredValue: "0 MT",
                nearExpiredValue: "0 MT",
                avgRate: "₹ 0",
                pendingSaudaValue: "0 MT",
                overdueValue: "₹ 0",
                tomorrowDueValue: "₹ 0"
            });
            this.getView().setModel(this.oLocalModel, "localState");

            // ----------------------------------------------------
            // DATA FLOW: MOCK DATA MODEL
            // Loads static mock data from 'webapp/model/mockdata.json'.
            // Holds large datasets (distributors list, sales analytics, STP queues, approvals).
            // Direct binding examples in XML: items='{mockData>/bookedSaudaStatus}'
            // ----------------------------------------------------
            var oMockModel = new JSONModel();
            oMockModel.loadData("model/mockdata.json");
            this.getView().setModel(oMockModel, "mockData");

            // DATA FLOW TRIGGER: Trigger dashboard update once mock data has been loaded
            oMockModel.attachRequestCompleted(function() {
                // Extract nested structures and expose them at root level for XML bindings
                var oSaudaOverview = oMockModel.getProperty("/saudaOverview");
                if (oSaudaOverview) {
                    if (oSaudaOverview.stpConsole) {
                        oMockModel.setProperty("/stpConsole", oSaudaOverview.stpConsole);
                    }
                    if (oSaudaOverview.moreOptions) {
                        oMockModel.setProperty("/moreOptions", oSaudaOverview.moreOptions);
                    }
                    if (oSaudaOverview.ledgerOverview) {
                        oMockModel.setProperty("/ledgerOverview", oSaudaOverview.ledgerOverview);
                    }
                    if (oSaudaOverview.bookedSaudaStatus) {
                        oMockModel.setProperty("/bookedSaudaStatus", oSaudaOverview.bookedSaudaStatus);
                    }
                }
                this._updateDashboardData();
            }.bind(this));
        },

        onAfterRendering: function () {
            this._bindAllClickDelegates();
        },

        _bindAllClickDelegates: function() {
            // Attach event delegates for clicking on styled cards on Home Page
            this._attachClickDelegate("cardExpired", this.onExpiredPress);
            this._attachClickDelegate("cardNearExpired", this.onNearExpiredPress);
            this._attachClickDelegate("cardRate", this.onRatePress);
            this._attachClickDelegate("cardPendingSauda", this.onPendingSaudaPress);
            this._attachClickDelegate("cardOverdue", this.onOverduePress);
            this._attachClickDelegate("cardTomorrowDue", this.onTomorrowDuePress);
            this._attachClickDelegate("btnCustomerLedger", this.onLedgerPress);
            this._attachClickDelegate("btnCallToCustomer", this.onCallPress);
            this._attachClickDelegate("notificationBell", this.onBellPress);

            // Attach event delegates for Sauda Page
            this._attachClickDelegate("cardExtension", this.onExtensionPress);
            this._attachClickDelegate("cardBookedSauda", this.onBookedSaudaPress);
            this._attachClickDelegate("cardPriceDiscovery", this.onPriceDiscoveryPress);
            this._attachClickDelegate("cardLimitEnhance", this.onLimitEnhancePress);
            this._attachClickDelegate("cardSalesOrder", this.onSalesOrderPress);
            this._attachClickDelegate("cardSaudaApproval", this.onSaudaApprovalPress);
            this._attachClickDelegate("btnCreateApproval", this.onCreateApprovalPress);

            // Sub-page back navigation click delegates
            this._attachClickDelegate("btnBookedSaudaBack", this.onBookedSaudaBack);
            this._attachClickDelegate("btnLedgerBack", this.onLedgerBack);
            this._attachClickDelegate("btnUpdatesBack", this.onUpdatesBack);
            this._attachClickDelegate("btnFeedbackRequest", this.onFeedbackRequestPress);
            this._attachClickDelegate("btnSurvey", this.onSurveyPress);
            this._attachClickDelegate("btnSpecialNotice", this.onSpecialNoticePress);

            // Bottom navigation click delegates
            this._attachClickDelegate("navHome", function() { this._setActiveNav("navHome"); }.bind(this));
            this._attachClickDelegate("navSauda", function() { this._setActiveNav("navSauda"); }.bind(this));
            this._attachClickDelegate("navSales", function() { this._setActiveNav("navSales"); }.bind(this));
            this._attachClickDelegate("navSTP", function() { this._setActiveNav("navSTP"); }.bind(this));
            this._attachClickDelegate("navMore", function() { this._setActiveNav("navMore"); }.bind(this));
        },

        _attachClickDelegate: function (sId, fnHandler) {
            var oControl = this.getView().byId(sId);
            if (oControl) {
                if (oControl._oClickDelegate) {
                    oControl.removeEventDelegate(oControl._oClickDelegate);
                }
                oControl._oClickDelegate = {
                    onclick: fnHandler.bind(this)
                };
                oControl.addEventDelegate(oControl._oClickDelegate);
            }
        },

        // Helper to instantiate controls dynamically and add style classes cleanly
        _createControl: function (ControlClass, oSettings, vClasses) {
            var oControl = new ControlClass(oSettings);
            if (vClasses) {
                if (Array.isArray(vClasses)) {
                    vClasses.forEach(function (sClass) {
                        if (sClass) oControl.addStyleClass(sClass);
                    });
                } else if (typeof vClasses === "string") {
                    oControl.addStyleClass(vClasses);
                }
            }
            return oControl;
        },

        // Helper to update metrics based on distributor & period
        _updateDashboardData: function () {
            var oMockModel = this.getView().getModel("mockData");
            if (!oMockModel) return;

            var sDistKey = this.oLocalModel.getProperty("/selectedDistributor");
            var sPeriod = this.oLocalModel.getProperty("/activePeriod");

            var oDistData = oMockModel.getProperty("/dashboardData/" + sDistKey);
            if (!oDistData) return;

            var oPeriodData = oDistData[sPeriod];
            var oExpiredData = oDistData.expired;

            // Set Sauda properties
            this.oLocalModel.setProperty("/saudaValue", oPeriodData.sauda.value);
            this.oLocalModel.setProperty("/saudaTarget", oPeriodData.sauda.target);
            this.oLocalModel.setProperty("/saudaPercent", oPeriodData.sauda.percent);
            this.oLocalModel.setProperty("/saudaWeeks", oPeriodData.sauda.weeks);

            // Set Sales properties
            this.oLocalModel.setProperty("/salesValue", oPeriodData.sales.value);
            this.oLocalModel.setProperty("/salesTarget", oPeriodData.sales.target);
            this.oLocalModel.setProperty("/salesPercent", oPeriodData.sales.percent);
            this.oLocalModel.setProperty("/salesWeeks", oPeriodData.sales.weeks);

            // Set Expired properties
            this.oLocalModel.setProperty("/expiredValue", oExpiredData.value);
            this.oLocalModel.setProperty("/nearExpiredValue", oExpiredData.nearExpired);
            this.oLocalModel.setProperty("/avgRate", oExpiredData.avgRate);
            this.oLocalModel.setProperty("/pendingSaudaValue", oExpiredData.pendingSauda);
            this.oLocalModel.setProperty("/overdueValue", oExpiredData.overdue);
            this.oLocalModel.setProperty("/tomorrowDueValue", oExpiredData.tomorrowDue);

            // Update Sales Analytics page metrics dynamically on the mockData model
            var oSalesAnalyticsData = oMockModel.getProperty("/salesAnalyticsByDistributor/" + sDistKey);
            if (oSalesAnalyticsData) {
                oMockModel.setProperty("/salesAnalytics", oSalesAnalyticsData);
            }
        },

        // Event Handlers for Home Page
        onDistributorChange: function (oEvent) {
            var sKey = oEvent.getParameter("selectedItem").getKey();
            this.oLocalModel.setProperty("/selectedDistributor", sKey);
            this._updateDashboardData();
            MessageToast.show("Data filtered for " + oEvent.getParameter("selectedItem").getText());
        },

        onTabSaudaPress: function () {
            this.oLocalModel.setProperty("/activeTab", "Sauda");
        },

        onTabSalesPress: function () {
            this.oLocalModel.setProperty("/activeTab", "Sales");
        },

        onPeriodMtdPress: function () {
            this.oLocalModel.setProperty("/activePeriod", "MTD");
            this._updateDashboardData();
        },

        onPeriodQtdPress: function () {
            this.oLocalModel.setProperty("/activePeriod", "QTD");
            this._updateDashboardData();
        },

        onPeriodYtdPress: function () {
            this.oLocalModel.setProperty("/activePeriod", "YTD");
            this._updateDashboardData();
        },

        onBellPress: function () {
            MessageBox.information("Notifications:\n\n1. Distributor Rohan Distributors registered 5 MT over target.\n2. Invoices worth ₹ 96.25 Lacs are Overdue.\n3. Near Expired contract alerts generated.");
        },

        onRealTimeStatsPress: function () {
            this.getView().setBusy(true);
            setTimeout(function() {
                this.getView().setBusy(false);
                MessageToast.show("Stats synced in real-time.");
            }.bind(this), 800);
        },

        // Card press handlers for Home Page
        onExpiredPress: function () {
            var aExpired = this.getView().getModel("mockData").getProperty("/cardDetails/expired");
            this._showContractTableDialog("Expired Contracts", aExpired);
        },

        onNearExpiredPress: function () {
            var aNearExpired = this.getView().getModel("mockData").getProperty("/cardDetails/nearExpired");
            this._showContractTableDialog("Near Expired Contracts", aNearExpired);
        },

        onRatePress: function () {
            // DATA FLOW: Read dynamic average booking rate from localState model (synced with mockdata.json)
            var sAvgRate = this.oLocalModel.getProperty("/avgRate");
            var fRateVal = parseFloat(sAvgRate.replace(/[^\d]/g, ""));
            var that = this;
            var oDialog;

            var oQtyInput = new Input({
                type: "Number",
                value: "15",
                width: "100%"
            });

            var oAmountText = that._createControl(Text, {
                text: "₹ 0.00"
            }, "rate-calc-value-amount");

            var updateCalculations = function () {
                var fQty = parseFloat(oQtyInput.getValue());
                if (fQty && fQty > 0) {
                    var fTotal = fQty * fRateVal;
                    oAmountText.setText("₹ " + fTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
                } else {
                    oAmountText.setText("₹ 0.00");
                }
            };

            oQtyInput.attachLiveChange(updateCalculations);

            var oFormContainer = that._createControl(VBox, {
                items: [
                    that._createControl(Label, { text: "Simulated Booking Quantity (MT)" }, "sauda-auth-field-label"),
                    oQtyInput,
                    that._createControl(VBox, {}, "rate-calc-separator"),
                    that._createControl(HBox, {
                        width: "100%",
                        justifyContent: "SpaceBetween",
                        alignItems: "Center",
                        items: [
                            that._createControl(Text, { text: "Calculated Value (INR):" }, "rate-calc-value-label"),
                            oAmountText
                        ]
                    })
                ]
            }, "rate-calc-form-box");

            var oDialogContent = that._createControl(VBox, {
                items: [
                    // Header Section
                    that._createControl(HBox, {
                        items: [
                            that._createControl(VBox, {
                                alignItems: "Center",
                                justifyContent: "Center",
                                items: [
                                    that._createControl(Icon, {
                                        src: "sap-icon://hint"
                                    }, "info-dialog-icon")
                                ]
                            }, "info-dialog-icon-circle"),
                            that._createControl(Text, {
                                text: "Today's Rate Calculator"
                            }, "info-dialog-title")
                        ]
                    }, "info-dialog-header"),

                    // Description
                    that._createControl(Text, {
                        text: "The average book rate for today stands at " + sAvgRate.replace("₹", "Rs. ") + "/MT. Simulate order margins dynamically below:"
                    }, "info-dialog-body"),

                    // Form Box
                    oFormContainer,

                    // Close Button
                    that._createControl(Button, {
                        text: "Close",
                        press: function () {
                            oDialog.close();
                        }
                    }, "info-dialog-close-btn")
                ]
            }, "info-dialog-container");

            oDialog = new Dialog({
                showHeader: false,
                contentWidth: "380px",
                content: [ oDialogContent ],
                afterClose: function () {
                    oDialog.destroy();
                }
            });

            oDialog.addStyleClass("custom-rate-calc-dialog");
            oDialog.open();

            // Run initial calculation
            updateCalculations();
        },

        onPendingSaudaPress: function () {
            var aPending = this.getView().getModel("mockData").getProperty("/cardDetails/pendingSauda");
            this._showContractTableDialog("Pending Sauda", aPending);
        },

        onOverduePress: function () {
            // DATA FLOW: Read dynamic total overdue value from localState model (synced with mockdata.json)
            var sOverdue = this.oLocalModel.getProperty("/overdueValue");
            var oDistSelect = this.getView().byId("distributorSelect");
            var sDistName = oDistSelect && oDistSelect.getSelectedItem() ? oDistSelect.getSelectedItem().getText() : "All Distributor";

            MessageBox.show(
                "Overdue Dues Breakdown for " + sDistName + ":\n\n" +
                "- Abhishek Agri Industries: ₹ 45,30,500.00 (Due > 30 Days)\n" +
                "- Swastik Food Products: ₹ 30,12,087.08 (Due > 15 Days)\n" +
                "- Apex Grain Merchants: ₹ 20,82,500.00 (Due > 7 Days)\n\n" +
                "Total Overdue Balance: " + sOverdue,
                {
                    icon: MessageBox.Icon.WARNING,
                    title: "Overdue Payments",
                    actions: [MessageBox.Action.CLOSE]
                }
            );
        },

        onTomorrowDuePress: function () {
            // DATA FLOW: Read dynamic tomorrow due value from localState model (synced with mockdata.json)
            var sTomorrowDue = this.oLocalModel.getProperty("/tomorrowDueValue");
            var oDistSelect = this.getView().byId("distributorSelect");
            var sDistName = oDistSelect && oDistSelect.getSelectedItem() ? oDistSelect.getSelectedItem().getText() : "All Distributor";

            MessageBox.show(
                "Upcoming Dues Tomorrow for " + sDistName + ":\n\n" +
                "- Galaxy Retail Corporation: ₹ 92,60,561.00\n" +
                "- Sai Agro Foods: ₹ 60,00,000.00\n\n" +
                "Total Incoming Dues: " + sTomorrowDue,
                {
                    icon: MessageBox.Icon.INFORMATION,
                    title: "Tomorrow's Incoming Dues",
                    actions: [MessageBox.Action.CLOSE]
                }
            );
        },

        // Action Handlers: Customer Ledger
        onLedgerPress: function () {
            this._navigateToLedgerScreen("Home");
        },

        _navigateToLedgerScreen: function(sParentPage) {
            this._sLedgerParentPage = sParentPage || "Home";
            this.oLocalModel.setProperty("/activeNav", "CustomerLedger");
            setTimeout(function() {
                this._bindAllClickDelegates();
            }.bind(this), 100);
        },

        onLedgerBack: function() {
            var sParent = this._sLedgerParentPage || "Home";
            this.oLocalModel.setProperty("/activeNav", sParent);
            setTimeout(function() {
                this._bindAllClickDelegates();
            }.bind(this), 100);
        },

        onCustomerLedgerItemPress: function(oEvent) {
            var oItem = oEvent.getSource();
            var oContext = oItem.getBindingContext("mockData");
            var oData = oContext.getObject();
            var that = this;

            var oDialog = new Dialog({
                showHeader: false,
                contentWidth: "360px",
                content: [
                    that._createControl(VBox, {
                        items: [
                            that._createControl(HBox, {
                                items: [
                                    that._createControl(VBox, {
                                        alignItems: "Center",
                                        justifyContent: "Center",
                                        items: [
                                            that._createControl(Icon, {
                                                src: "sap-icon://hint"
                                            }, "info-dialog-icon")
                                        ]
                                    }, "info-dialog-icon-circle"),
                                    that._createControl(Text, {
                                        text: oData.name
                                    }, "info-dialog-title")
                                ]
                            }, "info-dialog-header"),
                            that._createControl(Text, {
                                text: "Ledger summary for unit branch in " + oData.address + ". Balance reflects total unadjusted invoices."
                            }, "info-dialog-body"),
                            
                            // Slate container details box
                            that._createControl(VBox, {
                                items: [
                                    new HBox({
                                        justifyContent: "SpaceBetween",
                                        width: "100%",
                                        items: [
                                            that._createControl(Text, { text: "Owner Name:" }, "ledger-popup-label"),
                                            that._createControl(Text, { text: oData.owner || "Swati Gupta" }, "ledger-popup-val-dark")
                                        ]
                                    }),
                                    new HBox({
                                        justifyContent: "SpaceBetween",
                                        width: "100%",
                                        items: [
                                            that._createControl(Text, { text: "Total Outstanding:" }, "ledger-popup-label"),
                                            that._createControl(Text, { text: oData.balance || "Rs. 0.00" }, "ledger-popup-val-red")
                                        ]
                                    }),
                                    new HBox({
                                        justifyContent: "SpaceBetween",
                                        width: "100%",
                                        items: [
                                            that._createControl(Text, { text: "Overdue Days:" }, "ledger-popup-label"),
                                            that._createControl(Text, { text: oData.overdueDays || "45 Days" }, "ledger-popup-val-orange")
                                        ]
                                    }),
                                    new HBox({
                                        justifyContent: "SpaceBetween",
                                        width: "100%",
                                        items: [
                                            that._createControl(Text, { text: "Credit Limit Status:" }, "ledger-popup-label"),
                                            that._createControl(Text, { text: oData.creditStatus || "Healthy" }, "ledger-popup-val-green")
                                        ]
                                    })
                                ]
                            }, "ledger-popup-box"),
                            
                            // Close button
                            that._createControl(Button, {
                                text: "Close",
                                press: function () {
                                    oDialog.close();
                                }
                            }, "info-dialog-close-btn")
                        ]
                    }, "info-dialog-container")
                ],
                afterClose: function () {
                    oDialog.destroy();
                }
            });

            oDialog.addStyleClass("custom-info-dialog");
            oDialog.open();
        },

        onLedgerOverviewSearch: function(oEvent) {
            var sVal = oEvent.getParameter("newValue");
            var oList = this.getView().byId("ledgerCustomerList");
            var oBinding = oList.getBinding("items");
            if (oBinding) {
                var aFilters = [];
                if (sVal) {
                    aFilters.push(new sap.ui.model.Filter("name", "Contains", sVal));
                }
                oBinding.filter(aFilters);
            }
        },

        _openLedgerDetailDialog: function (sCustName) {
            var aLedger = this.getView().getModel("mockData").getProperty("/customerLedger");
            var oTable = new Table({
                width: "100%",
                noDataText: "No transactions found",
                columns: [
                    new Column({ header: new Text({ text: "Date" }), width: "90px" }),
                    new Column({ header: new Text({ text: "Tx ID" }), width: "90px", demandPopin: true, minScreenWidth: "Tablet" }),
                    new Column({ header: new Text({ text: "Description" }) }),
                    new Column({ header: new Text({ text: "Type" }), width: "80px", demandPopin: true, minScreenWidth: "Tablet" }),
                    new Column({ header: new Text({ text: "Amount" }), hAlign: "End" }),
                    new Column({ header: new Text({ text: "Balance" }), hAlign: "End" })
                ]
            });

            var that = this;
            var oTemplate = new ColumnListItem({
                cells: [
                    new Text({ text: "{ledgerModel>date}" }),
                    new Text({ text: "{ledgerModel>txId}" }),
                    new Text({ text: "{ledgerModel>desc}" }),
                    that._createControl(Text, { text: "{ledgerModel>type}" }, "text-bold"),
                    that._createControl(Text, { text: "{ledgerModel>amount}" }, "text-bold"),
                    new Text({ text: "{ledgerModel>balance}" })
                ]
            });

            var oLedgerModel = new JSONModel(aLedger);
            oTable.setModel(oLedgerModel, "ledgerModel");
            oTable.bindItems("ledgerModel>/", oTemplate);

            var oSearchField = new SearchField({
                placeholder: "Search ledger transactions...",
                showSearchButton: false,
                liveChange: function(oEvent) {
                    var sVal = oEvent.getParameter("newValue").toLowerCase();
                    var aFiltered = aLedger.filter(function(item) {
                        return item.desc.toLowerCase().includes(sVal) || 
                               item.txId.toLowerCase().includes(sVal) ||
                               item.date.toLowerCase().includes(sVal);
                    });
                    oLedgerModel.setData(aFiltered);
                }
            });
            oSearchField.addStyleClass("custom-search-field");

            var oDialog = new Dialog({
                title: "Ledger Details - " + sCustName,
                contentWidth: "700px",
                contentHeight: "450px",
                resizable: true,
                draggable: true,
                content: [
                    that._createControl(VBox, {
                        items: [
                            that._createControl(HBox, {
                                items: [
                                    that._createControl(VBox, { items: [ new Text({ text: "TOTAL DEBITS" }), that._createControl(Text, { text: "₹ 43.35 L" }, ["summary-value", "summary-value-debit"]) ] }, "ledger-summary-item"),
                                    that._createControl(VBox, { items: [ new Text({ text: "TOTAL CREDITS" }), that._createControl(Text, { text: "₹ 30.00 L" }, ["summary-value", "summary-value-credit"]) ] }, "ledger-summary-item"),
                                    that._createControl(VBox, { items: [ new Text({ text: "CURRENT BALANCE" }), that._createControl(Text, { text: "₹ 96.25 L" }, "summary-value") ] }, "ledger-summary-item")
                                ]
                            }, "ledger-summary-box"),
                            oSearchField,
                            oTable
                        ]
                    }, "sapUiContentPadding")
                ],
                endButton: new Button({
                    text: "Close",
                    press: function () {
                        oDialog.close();
                    }
                }),
                afterClose: function () {
                    oDialog.destroy();
                }
            });

            oDialog.open();
        },

        // Action Handlers: Call Customer
        onCallPress: function () {
            var sDistKey = this.oLocalModel.getProperty("/selectedDistributor");
            var oMockModel = this.getView().getModel("mockData");
            var aDistributors = oMockModel.getProperty("/distributors") || [];
            var oDist = aDistributors.find(function(d) { return d.key === sDistKey; });
            var sDistName = oDist ? oDist.name : "All Distributor";
            var that = this;

            var oDialog = new Dialog({
                showHeader: false,
                contentWidth: "360px",
                content: [
                    that._createControl(VBox, {
                        items: [
                            that._createControl(HBox, {
                                items: [
                                    that._createControl(VBox, {
                                        alignItems: "Center",
                                        justifyContent: "Center",
                                        items: [
                                            that._createControl(Icon, {
                                                src: "sap-icon://hint"
                                            }, "info-dialog-icon")
                                        ]
                                    }, "info-dialog-icon-circle"),
                                    that._createControl(Text, {
                                        text: "Outgoing VoIP Call"
                                    }, "info-dialog-title")
                                ]
                            }, "info-dialog-header"),
                            that._createControl(VBox, {
                                items: [
                                    new Text({ text: "Dialing register distributor number for \"" + sDistName + "\"..." }),
                                    new Text({ text: "Ensure headset or phone audio output is synced." })
                                ]
                            }, "voip-dialog-body"),
                            that._createControl(Button, {
                                text: "Close",
                                press: function () {
                                    oDialog.close();
                                }
                            }, "info-dialog-close-btn")
                        ]
                    }, "info-dialog-container")
                ],
                afterClose: function () {
                    oDialog.destroy();
                }
            });

            oDialog.addStyleClass("custom-voip-dialog");
            oDialog.open();
        },

        // Mock Telephone calling interface
        _startMockCall: function(sName, sRole) {
            var iSeconds = 0;
            var that = this;
            var oTimerText = that._createControl(Text, {
                text: "00:00"
            }, "calling-timer");

            var timerId = setInterval(function() {
                iSeconds++;
                var iMin = Math.floor(iSeconds / 60);
                var iSec = iSeconds % 60;
                var sMin = iMin < 10 ? "0" + iMin : iMin;
                var sSec = iSec < 10 ? "0" + iSec : iSec;
                oTimerText.setText(sMin + ":" + sSec);
            }, 1000);

            var oCallUI = that._createControl(VBox, {
                alignItems: "Center",
                justifyContent: "Center",
                items: [
                    that._createControl(VBox, {
                        alignItems: "Center",
                        justifyContent: "Center",
                        items: [ new Text({ text: sName.split(" ").map(function(w){return w[0];}).join("") }) ]
                    }, "calling-avatar-pulse"),
                    that._createControl(Text, { text: sName }, "calling-name"),
                    that._createControl(Text, { text: sRole }, "calling-status"),
                    oTimerText
                ]
            }, "calling-overlay-box");

            var oCallingDialog = new Dialog({
                showHeader: false,
                content: [ oCallUI ],
                endButton: new Button({
                    text: "End Call",
                    type: "Reject",
                    press: function() {
                        clearInterval(timerId);
                        oCallingDialog.close();
                        MessageToast.show("Call ended. Duration: " + oTimerText.getText());
                    }
                }),
                afterClose: function() {
                    clearInterval(timerId);
                    oCallingDialog.destroy();
                }
            });

            oCallingDialog.open();
        },

        // Helper: Card details popup table dialog
        _showContractTableDialog: function(sTitle, aData) {
            var oTable = new Table({
                width: "100%",
                noDataText: "No records found",
                columns: [
                    new Column({ header: new Text({ text: "Contract ID" }), width: "100px" }),
                    new Column({ header: new Text({ text: "Customer" }) }),
                    new Column({ header: new Text({ text: "Quantity" }), hAlign: "End", width: "90px" }),
                    new Column({ header: new Text({ text: "Rate" }), hAlign: "End", width: "100px" }),
                    new Column({ header: new Text({ text: "Status" }), width: "120px", demandPopin: true, minScreenWidth: "Tablet" })
                ]
            });

            var that = this;
            var oTemplate = new ColumnListItem({
                cells: [
                    that._createControl(Text, { text: "{tblModel>id}" }, "text-bold"),
                    new Text({ text: "{tblModel>customer}" }),
                    new Text({ text: "{tblModel>qty}" }),
                    new Text({ text: "{tblModel>rate}" }),
                    new Text({ text: "{tblModel>status}" })
                ]
            });

            var oTblModel = new JSONModel(aData);
            oTable.setModel(oTblModel, "tblModel");
            oTable.bindItems("tblModel>/", oTemplate);

            var oSearchField = new SearchField({
                placeholder: "Search customer name...",
                showSearchButton: false,
                liveChange: function(oEvent) {
                    var sVal = oEvent.getParameter("newValue").toLowerCase();
                    var aFiltered = aData.filter(function(item) {
                        return item.customer.toLowerCase().includes(sVal) ||
                               item.id.toLowerCase().includes(sVal);
                    });
                    oTblModel.setData(aFiltered);
                }
            });
            oSearchField.addStyleClass("custom-search-field");

            var oDialog = new Dialog({
                title: sTitle,
                contentWidth: "600px",
                contentHeight: "350px",
                resizable: true,
                draggable: true,
                content: [
                    that._createControl(VBox, {
                        items: [ oSearchField, oTable ]
                    }, "sapUiContentPadding")
                ],
                endButton: new Button({
                    text: "Close",
                    press: function () {
                        oDialog.close();
                    }
                }),
                afterClose: function () {
                    oDialog.destroy();
                }
            });

            oDialog.open();
        },


        // ==========================================
        // SAUDA PAGE EVENT HANDLERS & MODAL DIALOGS
        // ==========================================

        onExtensionPress: function () {
            var sDistKey = this.oLocalModel.getProperty("/selectedDistributor");
            var oMockModel = this.getView().getModel("mockData");
            var aDistributors = oMockModel.getProperty("/distributors") || [];
            var oDist = aDistributors.find(function(d) { return d.key === sDistKey; });
            var sDistName = oDist ? oDist.name : "All Distributor";
            var that = this;

            var oDialog = new Dialog({
                showHeader: false,
                contentWidth: "360px",
                content: [
                    that._createControl(VBox, {
                        items: [
                            that._createControl(HBox, {
                                items: [
                                    that._createControl(VBox, {
                                        alignItems: "Center",
                                        justifyContent: "Center",
                                        items: [
                                            that._createControl(Icon, {
                                                src: "sap-icon://hint"
                                            }, "info-dialog-icon")
                                        ]
                                    }, "info-dialog-icon-circle"),
                                    that._createControl(Text, {
                                        text: "Sauda Extension Request"
                                    }, "info-dialog-title")
                                ]
                            }, "info-dialog-header"),
                            that._createControl(Text, {
                                text: 'Your process queue for "Sauda Extension" has been successfully initiated. System allocation engines are matching rates for ' + sDistName + '.'
                            }, "info-dialog-body"),
                            that._createControl(Button, {
                                text: "Close",
                                press: function () {
                                    oDialog.close();
                                }
                            }, "info-dialog-close-btn")
                        ]
                    }, "info-dialog-container")
                ],
                afterClose: function () {
                    oDialog.destroy();
                }
            });

            oDialog.addStyleClass("custom-info-dialog");
            oDialog.open();
        },

        onBookedSaudaPress: function () {
            this.oLocalModel.setProperty("/activeNav", "BookedSauda");
            // Re-bind delegates since DOM changes
            setTimeout(function() {
                this._bindAllClickDelegates();
            }.bind(this), 100);
        },

        onBookedSaudaBack: function () {
            this.oLocalModel.setProperty("/activeNav", "Sauda");
            setTimeout(function() {
                this._bindAllClickDelegates();
            }.bind(this), 100);
        },

        onBookedSaudaFilter: function () {
            MessageToast.show("Filter panel opened.");
        },

        onAccordionToggle: function (oEvent) {
            var oItem = oEvent.getSource();
            var oBindingContext = oItem.getBindingContext("mockData");
            var sPath = oBindingContext.getPath();
            var oMockModel = this.getView().getModel("mockData");
            var bExpanded = oMockModel.getProperty(sPath + "/expanded");
            oMockModel.setProperty(sPath + "/expanded", !bExpanded);
        },

        onPriceDiscoveryPress: function () {
            var sDistKey = this.oLocalModel.getProperty("/selectedDistributor");
            var oMockModel = this.getView().getModel("mockData");
            var aDistributors = oMockModel.getProperty("/distributors") || [];
            var oDist = aDistributors.find(function(d) { return d.key === sDistKey; });
            var sDistName = oDist ? oDist.name : "All Distributors";
            var that = this;

            var oDialog = new Dialog({
                showHeader: false,
                contentWidth: "360px",
                content: [
                    that._createControl(VBox, {
                        items: [
                            that._createControl(HBox, {
                                items: [
                                    that._createControl(VBox, {
                                        alignItems: "Center",
                                        justifyContent: "Center",
                                        items: [
                                            that._createControl(Icon, {
                                                src: "sap-icon://hint"
                                            }, "info-dialog-icon")
                                        ]
                                    }, "info-dialog-icon-circle"),
                                    that._createControl(Text, {
                                        text: "Price Discovery Request"
                                    }, "info-dialog-title")
                                ]
                            }, "info-dialog-header"),
                            that._createControl(Text, {
                                text: 'Your process queue for "Price Discovery" has been successfully initiated. System allocation engines are matching rates for ' + sDistName + '.'
                            }, "info-dialog-body"),
                            that._createControl(Button, {
                                text: "Close",
                                press: function () {
                                    oDialog.close();
                                }
                            }, "info-dialog-close-btn")
                        ]
                    }, "info-dialog-container")
                ],
                afterClose: function () {
                    oDialog.destroy();
                }
            });

            oDialog.addStyleClass("custom-info-dialog");
            oDialog.open();
        },

        onLimitEnhancePress: function () {
            var sDistKey = this.oLocalModel.getProperty("/selectedDistributor");
            var oMockModel = this.getView().getModel("mockData");
            var aDistributors = oMockModel.getProperty("/distributors") || [];
            var oDist = aDistributors.find(function(d) { return d.key === sDistKey; });
            var sDistName = oDist ? oDist.name : "All Distributors";
            var that = this;

            var oDialog = new Dialog({
                showHeader: false,
                contentWidth: "360px",
                content: [
                    that._createControl(VBox, {
                        items: [
                            that._createControl(HBox, {
                                items: [
                                    that._createControl(VBox, {
                                        alignItems: "Center",
                                        justifyContent: "Center",
                                        items: [
                                            that._createControl(Icon, {
                                                src: "sap-icon://hint"
                                            }, "info-dialog-icon")
                                        ]
                                    }, "info-dialog-icon-circle"),
                                    that._createControl(Text, {
                                        text: "Limit Enhance Request"
                                    }, "info-dialog-title")
                                ]
                            }, "info-dialog-header"),
                            that._createControl(Text, {
                                text: 'Your process queue for "Limit Enhance" has been successfully initiated. System allocation engines are matching rates for ' + sDistName + '.'
                            }, "info-dialog-body"),
                            that._createControl(Button, {
                                text: "Close",
                                press: function () {
                                    oDialog.close();
                                }
                            }, "info-dialog-close-btn")
                        ]
                    }, "info-dialog-container")
                ],
                afterClose: function () {
                    oDialog.destroy();
                }
            });

            oDialog.addStyleClass("custom-info-dialog");
            oDialog.open();
        },

        onSalesOrderPress: function () {
            var sDistKey = this.oLocalModel.getProperty("/selectedDistributor");
            var oMockModel = this.getView().getModel("mockData");
            var aDistributors = oMockModel.getProperty("/distributors") || [];
            var oDist = aDistributors.find(function(d) { return d.key === sDistKey; });
            var sDistName = oDist ? oDist.name : "All Distributors";
            var that = this;

            var oDialog = new Dialog({
                showHeader: false,
                contentWidth: "360px",
                content: [
                    that._createControl(VBox, {
                        items: [
                            that._createControl(HBox, {
                                items: [
                                    that._createControl(VBox, {
                                        alignItems: "Center",
                                        justifyContent: "Center",
                                        items: [
                                            that._createControl(Icon, {
                                                src: "sap-icon://hint"
                                            }, "info-dialog-icon")
                                        ]
                                    }, "info-dialog-icon-circle"),
                                    that._createControl(Text, {
                                        text: "Sales Order Request"
                                    }, "info-dialog-title")
                                ]
                            }, "info-dialog-header"),
                            that._createControl(Text, {
                                text: 'Your process queue for "Sales Order" has been successfully initiated. System allocation engines are matching rates for ' + sDistName + '.'
                            }, "info-dialog-body"),
                            that._createControl(Button, {
                                text: "Close",
                                press: function () {
                                    oDialog.close();
                                }
                            }, "info-dialog-close-btn")
                        ]
                    }, "info-dialog-container")
                ],
                afterClose: function () {
                    oDialog.destroy();
                }
            });

            oDialog.addStyleClass("custom-info-dialog");
            oDialog.open();
        },

        onSaudaApprovalPress: function () {
            this.onCreateApprovalPress();
        },

        _showApprovalsListDialog: function() {
            var aApprovals = this.getView().getModel("mockData").getProperty("/saudaOverview/approvals");
            var that = this;
            
            var oTable = new Table({
                width: "100%",
                noDataText: "No pending approvals",
                columns: [
                    new Column({ header: new Text({ text: "Req ID" }), width: "90px" }),
                    new Column({ header: new Text({ text: "Customer" }) }),
                    new Column({ header: new Text({ text: "Quantity" }), hAlign: "End", width: "90px" }),
                    new Column({ header: new Text({ text: "Contract Value" }), hAlign: "End", width: "130px" }),
                    new Column({ header: new Text({ text: "Requestor" }), demandPopin: true, minScreenWidth: "Tablet" }),
                    new Column({ header: new Text({ text: "Date" }), width: "100px", demandPopin: true, minScreenWidth: "Tablet" }),
                    new Column({ header: new Text({ text: "Status" }), width: "130px" })
                ]
            });

            var oTemplate = new ColumnListItem({
                cells: [
                    that._createControl(Text, { text: "{approvalModel>reqId}" }, "text-bold"),
                    new Text({ text: "{approvalModel>customer}" }),
                    new Text({ text: "{approvalModel>qty}" }),
                    new Text({ text: "{approvalModel>value}" }),
                    new Text({ text: "{approvalModel>requestor}" }),
                    new Text({ text: "{approvalModel>date}" }),
                    that._createControl(Text, { text: "{approvalModel>status}" }, "text-orange-bold")
                ]
            });

            var oApprovalModel = new JSONModel(aApprovals);
            oTable.setModel(oApprovalModel, "approvalModel");
            oTable.bindItems("approvalModel>/", oTemplate);

            var oSearchField = new SearchField({
                placeholder: "Search approval request...",
                showSearchButton: false,
                liveChange: function(oEvent) {
                    var sVal = oEvent.getParameter("newValue").toLowerCase();
                    var aFiltered = aApprovals.filter(function(item) {
                        return item.customer.toLowerCase().includes(sVal) || 
                               item.reqId.toLowerCase().includes(sVal) ||
                               item.requestor.toLowerCase().includes(sVal);
                    });
                    oApprovalModel.setData(aFiltered);
                }
            });
            oSearchField.addStyleClass("custom-search-field");
            var oDialog = new Dialog({
                title: "Sauda Approvals Queue",
                contentWidth: "850px",
                contentHeight: "420px",
                resizable: true,
                draggable: true,
                content: [
                    that._createControl(VBox, {
                        items: [ oSearchField, oTable ]
                    }, "sapUiContentPadding")
                ],
                beginButton: new Button({
                    text: "Create Approval Request",
                    icon: "sap-icon://add",
                    type: "Emphasized",
                    press: function() {
                        oDialog.close();
                        that.onCreateApprovalPress();
                    }
                }),
                endButton: new Button({
                    text: "Close",
                    press: function () {
                        oDialog.close();
                    }
                }),
                afterClose: function () {
                    oDialog.destroy();
                }
            });

            oDialog.open();
        },

                onCreateApprovalPress: function () {
            var oMockModel = this.getView().getModel("mockData");
            var that = this;
            var oDialog;

            var oDistributorSelect = new Select({
                width: "100%"
            });
            var aCustomers = [
                { key: "Adithi Trading", name: "Adithi Trading" },
                { key: "RAJ SALES", name: "RAJ SALES" },
                { key: "AADINATH TRENDING COMPANY", name: "AADINATH TRENDING COMPANY" },
                { key: "Swastik Traders", name: "Swastik Traders" },
                { key: "Vanguard Enterprises", name: "Vanguard Enterprises" }
            ];
            aCustomers.forEach(function(cust) {
                oDistributorSelect.addItem(new CoreItem({
                    key: cust.key,
                    text: cust.name
                }));
            });

            var oProductSelect = new Select({
                width: "100%"
            });
            var aProducts = [
                { key: "SOYA BEAN OIL", name: "SOYA BEAN OIL" },
                { key: "REFINED SUGAR", name: "REFINED SUGAR" },
                { key: "PREMIUM WHEAT", name: "PREMIUM WHEAT" },
                { key: "COTTON BALES", name: "COTTON BALES" }
            ];
            aProducts.forEach(function(prod) {
                oProductSelect.addItem(new CoreItem({
                    key: prod.key,
                    text: prod.name
                }));
            });

            var oQtyInput = new Input({
                type: "Number",
                value: "10",
                width: "100%"
            });

            var oDatePicker = new DatePicker({
                value: "08-06-2026",
                displayFormat: "dd-MM-yyyy",
                valueFormat: "dd-MM-yyyy",
                width: "100%"
            });

            var oDistributorCol = new VBox({
                width: "100%",
                items: [
                    that._createControl(Label, { text: "Select Distributor" }, "sauda-auth-field-label"),
                    oDistributorSelect
                ]
            });

            var oProductCol = new VBox({
                width: "100%",
                items: [
                    that._createControl(Label, { text: "Product Segment" }, "sauda-auth-field-label"),
                    oProductSelect
                ]
            });

            var oQtyCol = new VBox({
                width: "48%",
                items: [
                    that._createControl(Label, { text: "Quantity (MT)" }, "sauda-auth-field-label"),
                    oQtyInput
                ]
            });

            var oDateCol = new VBox({
                width: "48%",
                items: [
                    that._createControl(Label, { text: "Booking Date" }, "sauda-auth-field-label"),
                    oDatePicker
                ]
            });

            var oRowFields = new HBox({
                width: "100%",
                justifyContent: "SpaceBetween",
                items: [ oQtyCol, oDateCol ]
            });

            var oFormContainer = that._createControl(VBox, {
                items: [
                    oDistributorCol,
                    oProductCol,
                    oRowFields
                ]
            }, "sauda-auth-form-box");

            var oDialogContent = that._createControl(VBox, {
                items: [
                    // Header Section
                    that._createControl(HBox, {
                        items: [
                            that._createControl(VBox, {
                                alignItems: "Center",
                                justifyContent: "Center",
                                items: [
                                    that._createControl(Icon, {
                                        src: "sap-icon://hint"
                                    }, "info-dialog-icon")
                                ]
                            }, "info-dialog-icon-circle"),
                            that._createControl(Text, {
                                text: "New Sauda Authorization"
                            }, "info-dialog-title")
                        ]
                    }, "info-dialog-header"),
                    
                    // Description
                    that._createControl(Text, {
                        text: "Create a fast allocation request directly below. Submitting will register a pending approval into the system ledger."
                    }, "info-dialog-body"),
                    
                    // Form Box
                    oFormContainer,
                    
                    // Buttons Row
                    that._createControl(HBox, {
                        items: [
                            that._createControl(Button, {
                                text: "Confirm & Submit",
                                press: function () {
                                    var sCust = oDistributorSelect.getSelectedKey();
                                    var sQty = oQtyInput.getValue();
                                    var sProduct = oProductSelect.getSelectedKey();
                                    var sDate = oDatePicker.getValue();

                                    if (!sCust || !sQty || !sDate) {
                                        MessageBox.error("Please fill in all requested fields.");
                                        return;
                                    }

                                    var aApprovals = oMockModel.getProperty("/saudaOverview/approvals");
                                    var sNewId = "APR-" + (893 + aApprovals.length + 1);
                                    
                                    var fRate = 50000;
                                    if (sProduct === "SOYA BEAN OIL") {
                                        fRate = 92300;
                                    } else if (sProduct === "REFINED SUGAR") {
                                        fRate = 42100;
                                    } else if (sProduct === "PREMIUM WHEAT") {
                                        fRate = 54200;
                                    } else if (sProduct === "COTTON BALES") {
                                        fRate = 68200;
                                    }

                                    var fValue = parseFloat(sQty) * fRate;
                                    
                                    var oNewApproval = {
                                        reqId: sNewId,
                                        customer: sCust,
                                        qty: sQty + " MT",
                                        value: "₹ " + fValue.toLocaleString("en-IN", { maximumFractionDigits: 0 }),
                                        requestor: "Rohan Shelar",
                                        date: sDate.split("-").reverse().join("-"), // convert dd-MM-yyyy to yyyy-MM-dd
                                        status: "Awaiting Approval"
                                    };

                                    aApprovals.unshift(oNewApproval);
                                    oMockModel.setProperty("/saudaOverview/approvals", aApprovals);

                                    oDialog.close();
                                    MessageBox.success("Sauda approval request " + sNewId + " submitted successfully. The approval queue has been updated.");
                                    
                                    setTimeout(function() {
                                        that._showApprovalsListDialog();
                                    }, 500);
                                }
                            }, "sauda-auth-submit-btn"),
                            that._createControl(Button, {
                                text: "Close",
                                press: function () {
                                    oDialog.close();
                                }
                            }, "sauda-auth-close-btn")
                        ]
                    }, "sauda-auth-buttons-row")
                ]
            }, "info-dialog-container");

            oDialog = new Dialog({
                showHeader: false,
                contentWidth: "380px",
                content: [ oDialogContent ],
                afterClose: function () {
                    oDialog.destroy();
                }
            });

            oDialog.addStyleClass("custom-sauda-auth-dialog");
            oDialog.open();
        },


        onMoreMenuItemPress: function (oEvent) {
            var oItem = oEvent.getSource();
            var oContext = oItem.getBindingContext("mockData");
            var oData = oContext.getObject();
            var sId = oData.id;

            if (sId === "btnLedgerScreen") {
                this._navigateToLedgerScreen("More");
            } else if (sId === "btnProductUpdates") {
                this._showProductUpdatesDialog();
            } else if (sId === "btnInviteDealers") {
                this._showInviteDealersDialog();
            } else if (sId === "btnPortalSettings") {
                this._showPortalSettingsDialog();
            }
        },

        _showProductUpdatesDialog: function() {
            this.oLocalModel.setProperty("/activeNav", "Updates");
            setTimeout(function() {
                this._bindAllClickDelegates();
            }.bind(this), 100);
        },

        onUpdatesBack: function () {
            this.oLocalModel.setProperty("/activeNav", "More");
            setTimeout(function() {
                this._bindAllClickDelegates();
            }.bind(this), 100);
        },

        onFeedbackRequestPress: function () {
            var that = this;
            var oDialog = new Dialog({
                showHeader: false,
                contentWidth: "360px",
                content: [
                    that._createControl(VBox, {
                        items: [
                            that._createControl(HBox, {
                                items: [
                                    that._createControl(VBox, {
                                        alignItems: "Center",
                                        justifyContent: "Center",
                                        items: [
                                            that._createControl(Icon, {
                                                src: "sap-icon://message-information"
                                            }, "info-dialog-icon")
                                        ]
                                    }, "info-dialog-icon-circle"),
                                    that._createControl(Text, {
                                        text: "Feedback Request"
                                    }, "info-dialog-title")
                                ]
                            }, "info-dialog-header"),
                            that._createControl(Text, {
                                text: "You tapped on \"Feedback Request\". This triggers your designated surveyor " +
                                    "feedback portal where you can enter ratings, review upcoming products " +
                                    "or report transit issues directly to the mill manager."
                            }, "info-dialog-body"),
                            that._createControl(Button, {
                                text: "Close",
                                press: function () {
                                    oDialog.close();
                                }
                            }, "info-dialog-close-btn")
                        ]
                    }, "info-dialog-container")
                ],
                afterClose: function () {
                    oDialog.destroy();
                }
            });

            oDialog.addStyleClass("custom-info-dialog");
            oDialog.open();
        },

        onSurveyPress: function () {
            var that = this;
            var oDialog = new Dialog({
                showHeader: false,
                contentWidth: "360px",
                content: [
                    that._createControl(VBox, {
                        items: [
                            that._createControl(HBox, {
                                items: [
                                    that._createControl(VBox, {
                                        alignItems: "Center",
                                        justifyContent: "Center",
                                        items: [
                                            that._createControl(Icon, {
                                                src: "sap-icon://message-information"
                                            }, "info-dialog-icon")
                                        ]
                                    }, "info-dialog-icon-circle"),
                                    that._createControl(Text, {
                                        text: "Survey"
                                    }, "info-dialog-title")
                                ]
                            }, "info-dialog-header"),
                            that._createControl(Text, {
                                text: "You tapped on \"Survey\". This triggers your designated surveyor " +
                                    "feedback portal where you can enter ratings, review upcoming products " +
                                    "or report transit issues directly to the mill manager."
                            }, "info-dialog-body"),
                            that._createControl(Button, {
                                text: "Close",
                                press: function () {
                                    oDialog.close();
                                }
                            }, "info-dialog-close-btn")
                        ]
                    }, "info-dialog-container")
                ],
                afterClose: function () {
                    oDialog.destroy();
                }
            });

            oDialog.addStyleClass("custom-info-dialog");
            oDialog.open();
        },

        onSpecialNoticePress: function () {
            var that = this;
            var oDialog = new Dialog({
                showHeader: false,
                contentWidth: "360px",
                content: [
                    that._createControl(VBox, {
                        items: [
                            that._createControl(HBox, {
                                items: [
                                    that._createControl(VBox, {
                                        alignItems: "Center",
                                        justifyContent: "Center",
                                        items: [
                                            that._createControl(Icon, {
                                                src: "sap-icon://message-information"
                                            }, "info-dialog-icon")
                                        ]
                                    }, "info-dialog-icon-circle"),
                                    that._createControl(Text, {
                                        text: "Special Information / Notice"
                                    }, "info-dialog-title")
                                ]
                            }, "info-dialog-header"),
                            that._createControl(Text, {
                                text: "You tapped on \"Special Information / Notice\". This triggers your " +
                                    "designated surveyor feedback portal where you can enter ratings, review " +
                                    "upcoming products or report transit issues directly to the mill manager."
                            }, "info-dialog-body"),
                            that._createControl(Button, {
                                text: "Close",
                                press: function () {
                                    oDialog.close();
                                }
                            }, "info-dialog-close-btn")
                        ]
                    }, "info-dialog-container")
                ],
                afterClose: function () {
                    oDialog.destroy();
                }
            });

            oDialog.addStyleClass("custom-info-dialog");
            oDialog.open();
        },

        _showInviteDealersDialog: function() {
            var that = this;
            var oDialog = new Dialog({
                showHeader: false,
                contentWidth: "360px",
                content: [
                    that._createControl(VBox, {
                        items: [
                            that._createControl(HBox, {
                                items: [
                                    that._createControl(VBox, {
                                        alignItems: "Center",
                                        justifyContent: "Center",
                                        items: [
                                            that._createControl(Icon, {
                                                src: "sap-icon://hint"
                                            }, "info-dialog-icon")
                                        ]
                                    }, "info-dialog-icon-circle"),
                                    that._createControl(Text, {
                                        text: "App Sharer"
                                    }, "info-dialog-title")
                                ]
                            }, "info-dialog-header"),
                            that._createControl(Text, {
                                text: "Generating your personalized distributor invite code..."
                            }, "info-dialog-body"),
                            that._createControl(Button, {
                                text: "Close",
                                press: function () {
                                    oDialog.close();
                                }
                            }, "info-dialog-close-btn")
                        ]
                    }, "info-dialog-container")
                ],
                afterClose: function () {
                    oDialog.destroy();
                }
            });

            oDialog.addStyleClass("custom-info-dialog");
            oDialog.open();
        },

        _showPortalSettingsDialog: function() {
            var that = this;
            var oDialog = new Dialog({
                showHeader: false,
                contentWidth: "360px",
                content: [
                    that._createControl(VBox, {
                        items: [
                            that._createControl(HBox, {
                                items: [
                                    that._createControl(VBox, {
                                        alignItems: "Center",
                                        justifyContent: "Center",
                                        items: [
                                            that._createControl(Icon, {
                                                src: "sap-icon://hint"
                                            }, "info-dialog-icon")
                                        ]
                                    }, "info-dialog-icon-circle"),
                                    that._createControl(Text, {
                                        text: "Preferences"
                                    }, "info-dialog-title")
                                ]
                            }, "info-dialog-header"),
                            that._createControl(Text, {
                                text: "Toggle app settings or dark themes in upcoming version!"
                            }, "info-dialog-body"),
                            that._createControl(Button, {
                                text: "Close",
                                press: function () {
                                    oDialog.close();
                                }
                            }, "info-dialog-close-btn")
                        ]
                    }, "info-dialog-container")
                ],
                afterClose: function () {
                    oDialog.destroy();
                }
            });

            oDialog.addStyleClass("custom-info-dialog");
            oDialog.open();
        },


        // ==========================================
        // MULTI-PAGE NAVIGATION CONTROLS
        // ==========================================

        _setActiveNav: function(sNavId) {
            var aNavs = ["navHome", "navSauda", "navSales", "navSTP", "navMore"];
            
            // Toggle active classes using jQuery
            aNavs.forEach(function(id) {
                var oControl = this.getView().byId(id);
                if (oControl) {
                    var $el = oControl.$();
                    if (id === sNavId) {
                        $el.addClass("nav-item-active");
                    } else {
                        $el.removeClass("nav-item-active");
                    }
                }
            }, this);

            var sTabName = sNavId.substring(3); // Remove 'nav' prefix
            this.oLocalModel.setProperty("/activeNav", sTabName);
            
            // Re-bind click delegates when switching pages as elements render/re-render
            setTimeout(function() {
                this._bindAllClickDelegates();
            }.bind(this), 100);
            
            MessageToast.show("Navigated to " + sTabName);
        }
    });
});