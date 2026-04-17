package com.golfgambletracker.app;

import android.os.Bundle;
import androidx.core.view.WindowCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Render edge-to-edge so env(safe-area-inset-*) populates in the
        // WebView. AppLayout.tsx handles the inset padding itself. Required
        // for Android <15; on 15+ this is the default behaviour.
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        super.onCreate(savedInstanceState);
    }
}
