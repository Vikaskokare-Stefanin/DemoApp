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
            // Define local state model for UI properties
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

            // Load static mock data
            var oMockModel = new JSONModel();
            oMockModel.loadData("model/mockdata.json");
            this.getView().setModel(oMockModel, "mockData");

            // Update local state when mock data finishes loading
            oMockModel.attachRequestCompleted(function() {
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
                oControl.addEventDelegate({
                    onclick: fnHandler.bind(this)
                });
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
            MessageBox.show(
                "Today's Booking Rate Details:\n\n" +
                "- Average Book Rate: ₹ 54,200 per MT\n" +
                "- Today's Maximum Rate: ₹ 54,600 / MT\n" +
                "- Today's Minimum Rate: ₹ 53,900 / MT\n\n" +
                "Rates are static and updated as of 09:00 AM today.",
                {
                    icon: MessageBox.Icon.INFORMATION,
                    title: "Rate Information",
                    actions: [MessageBox.Action.CLOSE]
                }
            );
        },

        onPendingSaudaPress: function () {
            var aPending = this.getView().getModel("mockData").getProperty("/cardDetails/pendingSauda");
            this._showContractTableDialog("Pending Sauda", aPending);
        },

        onOverduePress: function () {
            MessageBox.show(
                "Overdue Dues Breakdown:\n\n" +
                "- Abhishek Agri Industries: ₹ 45,30,500.00 (Due > 30 Days)\n" +
                "- Swastik Food Products: ₹ 30,12,087.08 (Due > 15 Days)\n" +
                "- Apex Grain Merchants: ₹ 20,82,500.00 (Due > 7 Days)\n\n" +
                "Total Overdue: " + this.oLocalModel.getProperty("/overdueValue"),
                {
                    icon: MessageBox.Icon.WARNING,
                    title: "Overdue Payments",
                    actions: [MessageBox.Action.CLOSE]
                }
            );
        },

        onTomorrowDuePress: function () {
            MessageBox.show(
                "Upcoming Dues (Tomorrow):\n\n" +
                "- Galaxy Retail Corporation: ₹ 92,60,561.00\n" +
                "- Sai Agro Foods: ₹ 60,00,000.00\n\n" +
                "Total Incoming Dues: " + this.oLocalModel.getProperty("/tomorrowDueValue"),
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
            this._openLedgerDetailDialog(oData.name);
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
            var aContacts = this.getView().getModel("mockData").getProperty("/contacts");
            var oContactList = new List({
                noDataText: "No contacts found"
            });

            var oContactModel = new JSONModel(aContacts);
            oContactList.setModel(oContactModel, "contactModel");

            var that = this;
            oContactList.bindItems("contactModel>/", function(sId, oContext) {
                var oData = oContext.getObject();
                
                var oAvatar = that._createControl(VBox, {
                    items: [ new Text({ text: oData.avatar }) ]
                }, "contact-item-avatar");

                var oDetails = new VBox({
                    items: [
                        that._createControl(Text, { text: oData.name }, "contact-item-name"),
                        that._createControl(Text, { text: oData.role + " | " + oData.phone }, "contact-item-details")
                    ]
                });

                var oCallBtn = new Button({
                    icon: "sap-icon://phone",
                    type: "Emphasized",
                    press: function() {
                        oCallDialog.close();
                        that._startMockCall(oData.name, oData.role);
                    }
                });

                return new CustomListItem({
                    content: [
                        that._createControl(HBox, {
                            justifyContent: "SpaceBetween",
                            alignItems: "Center",
                            width: "100%",
                            items: [
                                new HBox({ gap: "15px", alignItems: "Center", items: [ oAvatar, oDetails ] }),
                                oCallBtn
                            ]
                        }, "sapUiContentPadding")
                    ]
                });
            });

            var oSearchField = new SearchField({
                placeholder: "Search directory by name/role...",
                liveChange: function(oEvent) {
                    var sVal = oEvent.getParameter("newValue").toLowerCase();
                    var aFiltered = aContacts.filter(function(item) {
                        return item.name.toLowerCase().includes(sVal) || 
                               item.role.toLowerCase().includes(sVal);
                    });
                    oContactModel.setData(aFiltered);
                }
            });

            var oCallDialog = new Dialog({
                title: "Customer Contact Directory",
                contentWidth: "450px",
                contentHeight: "400px",
                content: [
                    that._createControl(VBox, {
                        items: [ oSearchField, oContactList ]
                    }, "sapUiContentPadding")
                ],
                endButton: new Button({
                    text: "Cancel",
                    press: function () {
                        oCallDialog.close();
                    }
                }),
                afterClose: function () {
                    oCallDialog.destroy();
                }
            });

            oCallDialog.open();
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
                liveChange: function(oEvent) {
                    var sVal = oEvent.getParameter("newValue").toLowerCase();
                    var aFiltered = aData.filter(function(item) {
                        return item.customer.toLowerCase().includes(sVal) ||
                               item.id.toLowerCase().includes(sVal);
                    });
                    oTblModel.setData(aFiltered);
                }
            });

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
            var aPrices = this.getView().getModel("mockData").getProperty("/saudaOverview/priceDiscovery") || [];
            var that = this;

            // Commodity Selection
            var oCommoditySelect = new Select({
                width: "100%"
            });
            aPrices.forEach(function(item) {
                oCommoditySelect.addItem(new CoreItem({
                    key: item.commodity,
                    text: item.commodity
                }));
            });

            var oQtyInput = new Input({
                placeholder: "Enter quantity in MT...",
                type: "Number",
                width: "100%"
            });

            // Summary Texts
            var oBaseRateText = that._createControl(Text, { text: "-" }, "text-bold");
            var oPremiumText = that._createControl(Text, { text: "-" }, "text-bold");
            var oTotalRateText = that._createControl(Text, { text: "-" }, "text-bold");
            var oEstimateValueText = that._createControl(Text, { text: "-" }, ["summary-value", "metric-value-orange"]);

            // Helper function to update rates
            var updateCalculations = function() {
                var sKey = oCommoditySelect.getSelectedKey();
                var oPriceItem = aPrices.find(function(x) { return x.commodity === sKey; });
                
                if (oPriceItem) {
                    oBaseRateText.setText(oPriceItem.basePrice + " / MT");
                    oPremiumText.setText(oPriceItem.premium + " / MT");
                    oTotalRateText.setText(oPriceItem.total + " / MT");
                    
                    var fRate = parseFloat(oPriceItem.total.replace(/[^\d]/g, ''));
                    var fQty = parseFloat(oQtyInput.getValue());
                    
                    if (fQty && fQty > 0) {
                        var fTotal = fRate * fQty;
                        oEstimateValueText.setText("₹ " + fTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
                    } else {
                        oEstimateValueText.setText("-");
                    }
                }
            };

            oCommoditySelect.attachChange(updateCalculations);
            oQtyInput.attachLiveChange(updateCalculations);

            var oDialog = new Dialog({
                title: "Live Price Discovery & Estimator",
                contentWidth: "400px",
                content: [
                    that._createControl(VBox, {
                        items: [
                            new Label({ text: "Select Commodity:", labelFor: oCommoditySelect }),
                            oCommoditySelect,
                            new Label({ text: "Enter Quantity (MT):", labelFor: oQtyInput }),
                            oQtyInput,
                            that._createControl(VBox, {
                                items: [
                                    new HBox({ justifyContent: "SpaceBetween", width: "100%", items: [ new Text({ text: "Base Price:" }), oBaseRateText ] }),
                                    new HBox({ justifyContent: "SpaceBetween", width: "100%", items: [ new Text({ text: "Market Premium:" }), oPremiumText ] }),
                                    new HBox({ justifyContent: "SpaceBetween", width: "100%", items: [ new Text({ text: "Effective Rate:" }), oTotalRateText ] }),
                                    that._createControl(VBox, {}, "price-discovery-separator"),
                                    new HBox({ justifyContent: "SpaceBetween", width: "100%", alignItems: "Center", items: [ new Text({ text: "ESTIMATED TOTAL VALUE:" }), oEstimateValueText ] })
                                ]
                            }, ["ledger-summary-box", "sapUiMediumMarginTop"])
                        ]
                    }, "sapUiContentPadding")
                ],
                endButton: new Button({
                    text: "Close",
                    press: function () {
                        oDialog.close();
                    }
                }),
                afterOpen: function() {
                    updateCalculations();
                },
                afterClose: function () {
                    oDialog.destroy();
                }
            });

            oDialog.open();
        },

        onLimitEnhancePress: function () {
            var oRequestInput = new Input({
                placeholder: "Enter enhancement value in ₹...",
                type: "Number",
                width: "100%"
            });

            var oJustifyArea = new TextArea({
                placeholder: "Enter justification/reason for credit limit extension...",
                rows: 3,
                width: "100%"
            });
            var that = this;

            var oDialog = new Dialog({
                title: "Request Credit Limit Enhancement",
                contentWidth: "400px",
                content: [
                    that._createControl(VBox, {
                        items: [
                            that._createControl(HBox, {
                                items: [
                                    that._createControl(VBox, { items: [ new Text({ text: "CURRENT LIMIT" }), that._createControl(Text, { text: "₹ 5.00 Cr" }, "summary-value") ] }, "ledger-summary-item"),
                                    that._createControl(VBox, { items: [ new Text({ text: "AVAILABLE BAL" }), that._createControl(Text, { text: "₹ 1.25 Cr" }, ["summary-value", "summary-value-credit"]) ] }, "ledger-summary-item")
                                ]
                            }, "ledger-summary-box"),
                            that._createControl(Label, { text: "Requested Enhancement Amount (₹):", labelFor: oRequestInput }, "sapUiTinyMarginBottom"),
                            oRequestInput,
                            that._createControl(Label, { text: "Justification:", labelFor: oJustifyArea }, ["sapUiSmallMarginTop", "sapUiTinyMarginBottom"]),
                            oJustifyArea
                        ]
                    }, "sapUiContentPadding")
                ],
                beginButton: new Button({
                    text: "Submit Request",
                    type: "Emphasized",
                    press: function () {
                        var sVal = oRequestInput.getValue();
                        var sReason = oJustifyArea.getValue();

                        if (!sVal || !sReason) {
                            MessageBox.error("Please fill in all requested fields.");
                            return;
                        }

                        oDialog.close();
                        MessageBox.success("Enhancement request of ₹ " + parseFloat(sVal).toLocaleString('en-IN') + " submitted to Credit Committee for review.");
                    }
                }),
                endButton: new Button({
                    text: "Cancel",
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

        onSalesOrderPress: function () {
            var aOrders = this.getView().getModel("mockData").getProperty("/saudaOverview/salesOrders");
            var that = this;

            var oTable = new Table({
                width: "100%",
                noDataText: "No sales orders found",
                columns: [
                    new Column({ header: new Text({ text: "Order ID" }), width: "100px" }),
                    new Column({ header: new Text({ text: "Customer" }) }),
                    new Column({ header: new Text({ text: "Quantity" }), hAlign: "End", width: "100px" }),
                    new Column({ header: new Text({ text: "Order Value" }), hAlign: "End", width: "140px" }),
                    new Column({ header: new Text({ text: "Status" }), width: "120px", demandPopin: true, minScreenWidth: "Tablet" })
                ]
            });

            var oTemplate = new ColumnListItem({
                cells: [
                    that._createControl(Text, { text: "{salesModel>id}" }, "text-bold"),
                    new Text({ text: "{salesModel>customer}" }),
                    new Text({ text: "{salesModel>qty}" }),
                    that._createControl(Text, { text: "{salesModel>value}" }, "text-bold"),
                    new Text({ text: "{salesModel>status}" })
                ]
            });

            var oSalesModel = new JSONModel(aOrders);
            oTable.setModel(oSalesModel, "salesModel");
            oTable.bindItems("salesModel>/", oTemplate);

            var oSearchField = new SearchField({
                placeholder: "Search by customer name or ID...",
                liveChange: function(oEvent) {
                    var sVal = oEvent.getParameter("newValue").toLowerCase();
                    var aFiltered = aOrders.filter(function(item) {
                        return item.customer.toLowerCase().includes(sVal) || 
                               item.id.toLowerCase().includes(sVal) ||
                               item.status.toLowerCase().includes(sVal);
                    });
                    oSalesModel.setData(aFiltered);
                }
            });
            var oDialog = new Dialog({
                title: "Recent Sales Orders",
                contentWidth: "700px",
                contentHeight: "380px",
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

        onSaudaApprovalPress: function () {
            this._showApprovalsListDialog();
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

        // Floating action button press handler
        onCreateApprovalPress: function () {
            var oMockModel = this.getView().getModel("mockData");
            var aPrices = oMockModel.getProperty("/saudaOverview/priceDiscovery") || [];

            var oCustInput = new Input({
                placeholder: "Enter customer/distributor name...",
                width: "100%"
            });

            var oQtyInput = new Input({
                placeholder: "Enter quantity in MT...",
                type: "Number",
                width: "100%"
            });

            var oCommoditySelect = new Select({
                width: "100%"
            });
            aPrices.forEach(function(item) {
                oCommoditySelect.addItem(new CoreItem({
                    key: item.commodity,
                    text: item.commodity
                }));
            });

            var oRateInput = new Input({
                placeholder: "Enter booking rate per MT...",
                type: "Number",
                width: "100%"
            });

            var that = this;
            var oDialog = new Dialog({
                title: "New Sauda Approval Request",
                contentWidth: "400px",
                content: [
                    that._createControl(VBox, {
                        items: [
                            that._createControl(Label, { text: "Customer/Buyer Name:", labelFor: oCustInput }, "sapUiTinyMarginBottom"),
                            oCustInput,
                            that._createControl(Label, { text: "Select Commodity:", labelFor: oCommoditySelect }, ["sapUiSmallMarginTop", "sapUiTinyMarginBottom"]),
                            oCommoditySelect,
                            that._createControl(Label, { text: "Quantity (MT):", labelFor: oQtyInput }, ["sapUiSmallMarginTop", "sapUiTinyMarginBottom"]),
                            oQtyInput,
                            that._createControl(Label, { text: "Requested Rate per MT (₹):", labelFor: oRateInput }, ["sapUiSmallMarginTop", "sapUiTinyMarginBottom"]),
                            oRateInput
                        ]
                    }, "sapUiContentPadding")
                ],
                beginButton: new Button({
                    text: "Submit for Approval",
                    type: "Emphasized",
                    press: function () {
                        var sCust = oCustInput.getValue();
                        var sQty = oQtyInput.getValue();
                        var sComm = oCommoditySelect.getSelectedKey();
                        var sRate = oRateInput.getValue();

                        if (!sCust || !sQty || !sRate) {
                            MessageBox.error("Please fill in all requested fields.");
                            return;
                        }

                        // Add new mock request to the static approvals model
                        var aApprovals = oMockModel.getProperty("/saudaOverview/approvals");
                        var sNewId = "APR-" + (893 + aApprovals.length + 1);
                        var fValue = parseFloat(sQty) * parseFloat(sRate);
                        
                        var oNewApproval = {
                            reqId: sNewId,
                            customer: sCust,
                            qty: sQty + " MT",
                            value: "₹ " + fValue.toLocaleString('en-IN', { maximumFractionDigits: 0 }),
                            requestor: "Rohan Shelar",
                            date: new Date().toISOString().split('T')[0],
                            status: "Awaiting Approval"
                        };

                        aApprovals.unshift(oNewApproval);
                        oMockModel.setProperty("/saudaOverview/approvals", aApprovals);

                        oDialog.close();
                        MessageBox.success("Sauda approval request " + sNewId + " submitted successfully. The approval queue has been updated.");
                        
                        // Show approvals dialog again to view changes
                        setTimeout(function() {
                            that._showApprovalsListDialog();
                        }, 500);
                    }
                }),
                endButton: new Button({
                    text: "Cancel",
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
            var that = this;
            var oDialog = new Dialog({
                title: "Interactive Product Updates",
                contentWidth: "400px",
                content: [
                    that._createControl(VBox, {
                        items: [
                            new Text({ text: "What's New in v2.4.6:", class: "text-bold" }).addStyleClass("sapUiSmallMarginBottom"),
                            new HBox({ gap: "10px", items: [ new Text({ text: "•" }), new Text({ text: "STP Console pipeline monitoring is now active with direct plant allocations." }) ] }).addStyleClass("sapUiTinyMarginBottom"),
                            new HBox({ gap: "10px", items: [ new Text({ text: "•" }), new Text({ text: "Sales Analytics page has been enhanced with volume metrics and family bar trends." }) ] }).addStyleClass("sapUiTinyMarginBottom"),
                            new HBox({ gap: "10px", items: [ new Text({ text: "•" }), new Text({ text: "Sauda approvals queue includes real-time booking additions." }) ] }).addStyleClass("sapUiTinyMarginBottom"),
                            new HBox({ gap: "10px", items: [ new Text({ text: "•" }), new Text({ text: "Bug fixes resolving inline XML style and class expression console warnings." }) ] })
                        ]
                    }, "sapUiContentPadding")
                ],
                endButton: new Button({
                    text: "Close",
                    press: function() {
                        oDialog.close();
                    }
                }),
                afterClose: function() {
                    oDialog.destroy();
                }
            });
            oDialog.open();
        },

        _showInviteDealersDialog: function() {
            var that = this;
            var oNameInput = new Input({ placeholder: "Enter sub-dealer name...", width: "100%" });
            var oPhoneInput = new Input({ placeholder: "Enter mobile number...", type: "Tel", width: "100%" });
            var oEmailInput = new Input({ placeholder: "Enter email address...", type: "Email", width: "100%" });

            var oDialog = new Dialog({
                title: "Invite Sub-Dealers",
                contentWidth: "400px",
                content: [
                    that._createControl(VBox, {
                        items: [
                            new Label({ text: "Sub-Dealer Name:", labelFor: oNameInput }).addStyleClass("sapUiTinyMarginBottom"),
                            oNameInput,
                            new Label({ text: "Mobile Number:", labelFor: oPhoneInput }).addStyleClass("sapUiSmallMarginTop").addStyleClass("sapUiTinyMarginBottom"),
                            oPhoneInput,
                            new Label({ text: "Email Address:", labelFor: oEmailInput }).addStyleClass("sapUiSmallMarginTop").addStyleClass("sapUiTinyMarginBottom"),
                            oEmailInput
                        ]
                    }, "sapUiContentPadding")
                ],
                beginButton: new Button({
                    text: "Send Invite",
                    type: "Emphasized",
                    press: function() {
                        var sName = oNameInput.getValue();
                        var sPhone = oPhoneInput.getValue();
                        if (!sName || !sPhone) {
                            MessageBox.error("Sub-Dealer Name and Mobile Number are required.");
                            return;
                        }
                        oDialog.close();
                        MessageBox.success("Invitation link sent to " + sName + " (" + sPhone + ") successfully.");
                    }
                }),
                endButton: new Button({
                    text: "Cancel",
                    press: function() {
                        oDialog.close();
                    }
                }),
                afterClose: function() {
                    oDialog.destroy();
                }
            });
            oDialog.open();
        },

        _showPortalSettingsDialog: function() {
            var that = this;
            var oSmsSwitch = new sap.m.Switch({ state: true, customTextOn: "Yes", customTextOff: "No" });
            var oPushSwitch = new sap.m.Switch({ state: true, customTextOn: "Yes", customTextOff: "No" });
            var oPerformanceSwitch = new sap.m.Switch({ state: false, customTextOn: "Yes", customTextOff: "No" });

            var oDialog = new Dialog({
                title: "Portal Configuration Settings",
                contentWidth: "400px",
                content: [
                    that._createControl(VBox, {
                        items: [
                            new HBox({ justifyContent: "SpaceBetween", alignItems: "Center", width: "100%", items: [ new Label({ text: "Enable SMS Alerts" }), oSmsSwitch ] }).addStyleClass("sapUiSmallMarginBottom"),
                            new HBox({ justifyContent: "SpaceBetween", alignItems: "Center", width: "100%", items: [ new Label({ text: "Push Notifications" }), oPushSwitch ] }).addStyleClass("sapUiSmallMarginBottom"),
                            new HBox({ justifyContent: "SpaceBetween", alignItems: "Center", width: "100%", items: [ new Label({ text: "High Performance GPU Render" }), oPerformanceSwitch ] })
                        ]
                    }, "sapUiContentPadding")
                ],
                beginButton: new Button({
                    text: "Save Settings",
                    type: "Emphasized",
                    press: function() {
                        oDialog.close();
                        MessageToast.show("Portal configuration saved successfully.");
                    }
                }),
                endButton: new Button({
                    text: "Cancel",
                    press: function() {
                        oDialog.close();
                    }
                }),
                afterClose: function() {
                    oDialog.destroy();
                }
            });
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