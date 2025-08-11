package com.swipecore.app;

import android.os.Bundle;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Ensure custom Capacitor plugins are registered before Bridge initialization
        registerPlugin(NativeAdsPlugin.class);
        super.onCreate(savedInstanceState);

        // Enable hardware acceleration for better performance
        getWindow().setFlags(
            android.view.WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED,
            android.view.WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED
        );

        // Optimize WebView for touch performance
        WebView webView = getBridge().getWebView();
        if (webView != null) {
            // Enable hardware acceleration
            webView.setLayerType(android.view.View.LAYER_TYPE_HARDWARE, null);

            // Optimize touch handling
            webView.getSettings().setJavaScriptEnabled(true);
            webView.getSettings().setDomStorageEnabled(true);
            webView.getSettings().setDatabaseEnabled(true);

            // Improve scrolling performance
            webView.setScrollBarStyle(android.view.View.SCROLLBARS_INSIDE_OVERLAY);
            webView.setScrollbarFadingEnabled(true);

            // Enable zoom controls but hide them
            webView.getSettings().setBuiltInZoomControls(false);
            webView.getSettings().setDisplayZoomControls(false);

            // Optimize caching
            webView.getSettings().setCacheMode(android.webkit.WebSettings.LOAD_DEFAULT);
            //webView.getSettings().setAppCacheEnabled(true);
        }
    }
}
