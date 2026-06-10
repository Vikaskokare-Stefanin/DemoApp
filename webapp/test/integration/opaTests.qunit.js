/* global QUnit */
QUnit.config.autostart = false;

sap.ui.require(["aiproject/test/integration/AllJourneys"
], function () {
	QUnit.start();
});
