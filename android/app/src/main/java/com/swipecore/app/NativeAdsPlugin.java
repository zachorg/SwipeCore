package com.swipecore.app;

import android.app.Activity;
import android.content.Context;
import android.graphics.Color;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.TextView;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import com.google.android.gms.ads.AdListener;
import com.google.android.gms.ads.AdLoader;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.LoadAdError;
import com.google.android.gms.ads.MobileAds;
import com.google.android.gms.ads.nativead.MediaView;
import com.google.android.gms.ads.nativead.NativeAd;
import com.google.android.gms.ads.nativead.NativeAdView;

@CapacitorPlugin(name = "NativeAds")
public class NativeAdsPlugin extends Plugin {

    private FrameLayout overlayContainer;
    private NativeAdView nativeAdView;
    private NativeAd currentAd;
    private AdLoader adLoader;

    @Override
    public void load() {
        super.load();
        Context context = getContext();
        MobileAds.initialize(context, initializationStatus -> {});
    }

    @com.getcapacitor.PluginMethod
    public void load(PluginCall call) {
        String adUnitId = call.getString("adUnitId");
        if (adUnitId == null || adUnitId.isEmpty()) {
            call.reject("Missing adUnitId");
            return;
        }

        Activity activity = getActivity();
        Context context = getContext();

        getBridge().executeOnMainThread(() -> {
            if (adLoader != null) {
                adLoader = null;
            }
            AdLoader.Builder builder = new AdLoader.Builder(context, adUnitId);
            builder.forNativeAd(nativeAd -> {
                destroyAd();
                currentAd = nativeAd;
                ensureNativeAdView(activity);
                populateNativeAdView(nativeAd, nativeAdView);
                call.resolve();
            });
            builder.withAdListener(new AdListener() {
                @Override
                public void onAdFailedToLoad(LoadAdError adError) {
                    call.reject("Failed to load native ad: " + adError.getMessage());
                }
            });
            adLoader = builder.build();
            adLoader.loadAd(new AdRequest.Builder().build());
        });
    }

    @com.getcapacitor.PluginMethod
    public void attach(PluginCall call) {
        double x = call.getDouble("x", 0.0);
        double y = call.getDouble("y", 0.0);
        double width = call.getDouble("width", 0.0);
        double height = call.getDouble("height", 0.0);

        Activity activity = getActivity();
        getBridge().executeOnMainThread(() -> {
            if (currentAd == null || nativeAdView == null) {
                call.reject("Native ad not loaded yet");
                return;
            }
            ensureOverlayContainer(activity);
            if (nativeAdView.getParent() != overlayContainer) {
                if (nativeAdView.getParent() instanceof ViewGroup) {
                    ((ViewGroup) nativeAdView.getParent()).removeView(nativeAdView);
                }
                overlayContainer.addView(nativeAdView);
            }
            FrameLayout.LayoutParams lp = new FrameLayout.LayoutParams(
                (int) Math.round(width),
                (int) Math.round(height)
            );
            lp.leftMargin = (int) Math.round(x);
            lp.topMargin = (int) Math.round(y);
            nativeAdView.setLayoutParams(lp);
            nativeAdView.setVisibility(View.VISIBLE);
            call.resolve();
        });
    }

    @com.getcapacitor.PluginMethod
    public void detach(PluginCall call) {
        getBridge().executeOnMainThread(() -> {
            if (overlayContainer != null && nativeAdView != null) {
                overlayContainer.removeView(nativeAdView);
                nativeAdView.setVisibility(View.GONE);
            }
            call.resolve();
        });
    }

    private void ensureOverlayContainer(Activity activity) {
        if (overlayContainer == null) {
            overlayContainer = new FrameLayout(activity);
            overlayContainer.setLayoutParams(new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            ));
            ((ViewGroup) activity.findViewById(android.R.id.content)).addView(overlayContainer);
        }
    }

    private void ensureNativeAdView(Context context) {
        if (nativeAdView != null) return;
        nativeAdView = new NativeAdView(context);
        nativeAdView.setBackgroundColor(Color.TRANSPARENT);

        // Create simple layout programmatically
        FrameLayout container = new FrameLayout(context);
        container.setLayoutParams(new FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT,
            FrameLayout.LayoutParams.MATCH_PARENT
        ));

        MediaView mediaView = new MediaView(context);
        mediaView.setId(View.generateViewId());
        FrameLayout.LayoutParams mediaLp = new FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT,
            FrameLayout.LayoutParams.MATCH_PARENT
        );
        mediaView.setLayoutParams(mediaLp);

        TextView headlineView = new TextView(context);
        headlineView.setId(View.generateViewId());
        headlineView.setTextColor(Color.WHITE);
        headlineView.setTextSize(TypedValue.COMPLEX_UNIT_SP, 18);
        FrameLayout.LayoutParams headlineLp = new FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.WRAP_CONTENT,
            FrameLayout.LayoutParams.WRAP_CONTENT
        );
        headlineLp.gravity = Gravity.BOTTOM | Gravity.START;
        headlineLp.leftMargin = dp(context, 16);
        headlineLp.bottomMargin = dp(context, 16);
        headlineView.setLayoutParams(headlineLp);

        Button ctaView = new Button(context);
        ctaView.setId(View.generateViewId());
        FrameLayout.LayoutParams ctaLp = new FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.WRAP_CONTENT,
            FrameLayout.LayoutParams.WRAP_CONTENT
        );
        ctaLp.gravity = Gravity.BOTTOM | Gravity.END;
        ctaLp.rightMargin = dp(context, 16);
        ctaLp.bottomMargin = dp(context, 16);
        ctaView.setLayoutParams(ctaLp);

        container.addView(mediaView);
        container.addView(headlineView);
        container.addView(ctaView);

        nativeAdView.setMediaView(mediaView);
        nativeAdView.setHeadlineView(headlineView);
        nativeAdView.setCallToActionView(ctaView);
        nativeAdView.addView(container);
    }

    private void populateNativeAdView(NativeAd nativeAd, NativeAdView adView) {
        // Headline
        TextView headlineView = (TextView) adView.getHeadlineView();
        if (headlineView != null) headlineView.setText(nativeAd.getHeadline());

        // Media handled by MediaView automatically

        // CTA
        View cta = adView.getCallToActionView();
        if (cta instanceof Button) {
            ((Button) cta).setText(nativeAd.getCallToAction());
        }

        adView.setNativeAd(nativeAd);
    }

    private int dp(Context context, int dp) {
        return Math.round(TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, dp,
                context.getResources().getDisplayMetrics()));
    }

    private void destroyAd() {
        if (currentAd != null) {
            currentAd.destroy();
            currentAd = null;
        }
        if (nativeAdView != null) {
            ViewGroup parent = (ViewGroup) nativeAdView.getParent();
            if (parent != null) {
                parent.removeView(nativeAdView);
            }
            nativeAdView.destroy();
            nativeAdView = null;
        }
    }

    @Override
    protected void handleOnDestroy() {
        super.handleOnDestroy();
        getBridge().executeOnMainThread(this::destroyAd);
    }
}


