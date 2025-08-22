package com.swipecore.app;

import android.os.Bundle;
import android.util.Log;
import android.webkit.ConsoleMessage;
import android.webkit.WebChromeClient;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
	private static final String TAG = "MainActivity";

	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		
		// Enable WebView debugging for release builds
		WebView.setWebContentsDebuggingEnabled(true);
		
		// Set up WebChromeClient to capture console messages and log them
		bridge.getWebView().setWebChromeClient(new WebChromeClient() {
			@Override
			public boolean onConsoleMessage(ConsoleMessage consoleMessage) {
				String level = "INFO";
				switch (consoleMessage.messageLevel()) {
					case ERROR: level = "ERROR"; break;
					case WARNING: level = "WARN"; break;
					case LOG: level = "LOG"; break;
					case DEBUG: level = "DEBUG"; break;
				}
				
				Log.d(TAG, String.format("JS Console [%s]: %s -- From line %d of %s", 
					level,
					consoleMessage.message(), 
					consoleMessage.lineNumber(), 
					consoleMessage.sourceId()));
				return true;
			}
		});
		
		Log.d(TAG, "MainActivity onCreate completed - WebView debugging and logging enabled");
	}
}