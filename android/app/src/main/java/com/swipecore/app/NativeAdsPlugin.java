package com.swipecore.app;

import android.app.Activity;
import android.content.Context;
import android.graphics.Color;
import android.graphics.Rect;
import android.util.Log;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.MotionEvent;
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
import com.google.android.gms.ads.MediaContent;
import com.google.android.gms.ads.nativead.MediaView;
import com.google.android.gms.ads.nativead.NativeAd;
import com.google.android.gms.ads.nativead.NativeAdView;
import android.webkit.WebView;

@CapacitorPlugin(name = "NativeAds")
public class NativeAdsPlugin extends Plugin {

    private FrameLayout overlayContainer;
    private NativeAdView nativeAdView;
    private NativeAd currentAd;
    private AdLoader adLoader;
    private Button ctaButton;
    private MediaView mediaViewRef;
    private TextView headlineViewRef;
    private static final String TAG = "NativeAds";
    private static final String TEST_NATIVE_AD_UNIT_ID = "ca-app-pub-3940256099942544/2247696110";

    // Forward a MotionEvent to the underlying WebView, translating to its local coordinates
    private void forwardTouchToWebView(MotionEvent event) {
        if (getBridge() == null) return;
        WebView webView = getBridge().getWebView();
        if (webView == null) return;
        int[] webLoc = new int[2];
        webView.getLocationOnScreen(webLoc);
        float localX = event.getRawX() - webLoc[0];
        float localY = event.getRawY() - webLoc[1];
        MotionEvent cloned = MotionEvent.obtain(event);
        cloned.setLocation(localX, localY);
        webView.dispatchTouchEvent(cloned);
        cloned.recycle();
    }

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
            boolean isTestUnit = TEST_NATIVE_AD_UNIT_ID.equals(adUnitId);
            Log.d(TAG, "Loading native ad | adUnitId=" + adUnitId + (isTestUnit ? " (TEST)" : ""));
            AdLoader.Builder builder = new AdLoader.Builder(context, adUnitId);
            builder.forNativeAd(nativeAd -> {
                destroyAd();
                currentAd = nativeAd;
                ensureNativeAdView(activity);
                populateNativeAdView(nativeAd, nativeAdView);
                try {
                    String headline = nativeAd.getHeadline();
                    String body = nativeAd.getBody();
                    String cta = nativeAd.getCallToAction();
                    String advertiser = nativeAd.getAdvertiser();
                    Double starRating = nativeAd.getStarRating();
                    String price = nativeAd.getPrice();
                    String store = nativeAd.getStore();
                    NativeAd.Image icon = nativeAd.getIcon();
                    String iconUri = icon != null && icon.getUri() != null ? icon.getUri().toString() : null;

                    int imagesCount = nativeAd.getImages() != null ? nativeAd.getImages().size() : 0;
                    String firstImageUri = null;
                    if (imagesCount > 0 && nativeAd.getImages().get(0).getUri() != null) {
                        firstImageUri = nativeAd.getImages().get(0).getUri().toString();
                    }

                    MediaContent mediaContent = nativeAd.getMediaContent();
                    boolean hasVideo = mediaContent != null && mediaContent.hasVideoContent();
                    float aspectRatio = mediaContent != null ? mediaContent.getAspectRatio() : 0f;

                    Log.d(TAG, "Native ad loaded" + (isTestUnit ? " (TEST)" : "")
                            + " | headline=" + headline
                            + ", body=" + body
                            + ", cta=" + cta
                            + ", advertiser=" + advertiser
                            + ", starRating=" + (starRating != null ? starRating : "null")
                            + ", price=" + price
                            + ", store=" + store
                            + ", iconUri=" + iconUri
                            + ", imagesCount=" + imagesCount
                            + ", firstImageUri=" + firstImageUri
                            + ", hasVideo=" + hasVideo
                            + ", aspectRatio=" + aspectRatio);
                } catch (Exception ignored) {}
                call.resolve();
            });
            builder.withAdListener(new AdListener() {
                @Override
                public void onAdFailedToLoad(LoadAdError adError) {
                    Log.w(TAG, "Native ad failed to load | code=" + adError.getCode() + ", message=" + adError.getMessage());
                    call.reject("Failed to load native ad: " + adError.getMessage());
                }

                @Override
                public void onAdClicked() {
                    Log.d(TAG, "Native ad clicked");
                }

                @Override
                public void onAdImpression() {
                    Log.d(TAG, "Native ad impression recorded");
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
            // Convert logical/CSS pixels from WebView to Android pixels using density
            float density = activity.getResources().getDisplayMetrics().density;
            int pxWidth = (int) Math.round(width * density);
            int pxHeight = (int) Math.round(height * density);
            int pxLeft = (int) Math.round(x * density);
            int pxTop = (int) Math.round(y * density);

            Log.d(TAG, "Attaching native ad overlay | css= {x=" + x + ", y=" + y + ", width=" + width + ", height=" + height + "} px= {left=" + pxLeft + ", top=" + pxTop + ", width=" + pxWidth + ", height=" + pxHeight + "}");
            ensureOverlayContainer(activity);
            if (nativeAdView.getParent() != overlayContainer) {
                if (nativeAdView.getParent() instanceof ViewGroup) {
                    ((ViewGroup) nativeAdView.getParent()).removeView(nativeAdView);
                }
                overlayContainer.addView(nativeAdView);
            }
            FrameLayout.LayoutParams lp = new FrameLayout.LayoutParams(
                pxWidth,
                pxHeight
            );
            lp.leftMargin = pxLeft;
            lp.topMargin = pxTop;
            nativeAdView.setLayoutParams(lp);
            nativeAdView.setVisibility(View.VISIBLE);
            call.resolve();
        });
    }

    @com.getcapacitor.PluginMethod
    public void detach(PluginCall call) {
        getBridge().executeOnMainThread(() -> {
            if (overlayContainer != null && nativeAdView != null) {
                Log.d(TAG, "Detaching native ad overlay");
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
            // Ensure the overlay container itself does not intercept or consume touch events
            overlayContainer.setClickable(false);
            overlayContainer.setFocusable(false);
            overlayContainer.setFocusableInTouchMode(false);
            overlayContainer.setClipChildren(false);
            overlayContainer.setClipToPadding(false);
            overlayContainer.setOnTouchListener((v, e) -> {
                forwardTouchToWebView(e);
                return true;
            });
            ((ViewGroup) activity.findViewById(android.R.id.content)).addView(overlayContainer);
            Log.d(TAG, "Created overlay container");
        }
    }

    private void ensureNativeAdView(Context context) {
        if (nativeAdView != null) return;
        nativeAdView = new NativeAdView(context);
        nativeAdView.setBackgroundColor(Color.TRANSPARENT);
        // Make the ad view itself non-interactive except for explicitly clickable children (e.g., CTA)
        nativeAdView.setClickable(false);
        nativeAdView.setFocusable(false);
        nativeAdView.setFocusableInTouchMode(false);

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
        mediaView.setClickable(false);

        TextView headlineView = new TextView(context);
        headlineView.setId(View.generateViewId());
        // Use dark text to remain visible over the app's white bottom panel
        headlineView.setTextColor(Color.BLACK);
        headlineView.setTextSize(TypedValue.COMPLEX_UNIT_SP, 18);
        FrameLayout.LayoutParams headlineLp = new FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.WRAP_CONTENT,
            FrameLayout.LayoutParams.WRAP_CONTENT
        );
        headlineLp.gravity = Gravity.BOTTOM | Gravity.START;
        headlineLp.leftMargin = dp(context, 16);
        headlineLp.bottomMargin = dp(context, 16);
        headlineView.setLayoutParams(headlineLp);
        headlineView.setClickable(false);

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
        // Only CTA is explicitly clickable so other areas can pass touches through to the WebView
        ctaView.setClickable(true);

        container.addView(mediaView);
        container.addView(headlineView);
        container.addView(ctaView);

        nativeAdView.setMediaView(mediaView);
        nativeAdView.setHeadlineView(headlineView);
        nativeAdView.setCallToActionView(ctaView);
        nativeAdView.addView(container);

        // Keep refs for touch routing
        this.ctaButton = ctaView;
        this.mediaViewRef = mediaView;
        this.headlineViewRef = headlineView;

        // Route non-CTA touches to the underlying WebView so the card remains swipeable
        nativeAdView.setOnTouchListener((v, event) -> {
            // Allow CTA region to handle its own clicks
            if (ctaButton != null && ctaButton.getVisibility() == View.VISIBLE) {
                int[] loc = new int[2];
                ctaButton.getLocationOnScreen(loc);
                Rect ctaRect = new Rect(loc[0], loc[1], loc[0] + ctaButton.getWidth(), loc[1] + ctaButton.getHeight());
                float rx = event.getRawX();
                float ry = event.getRawY();
                if (ctaRect.contains((int) rx, (int) ry)) {
                    return false; // don't consume; let CTA handle
                }
            }
            forwardTouchToWebView(event);
            return true; // consume so the ad view doesn't interfere
        });
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
            Log.d(TAG, "Destroying existing native ad");
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
        ctaButton = null;
        mediaViewRef = null;
        headlineViewRef = null;
    }

    @Override
    protected void handleOnDestroy() {
        super.handleOnDestroy();
        getBridge().executeOnMainThread(this::destroyAd);
    }
}


