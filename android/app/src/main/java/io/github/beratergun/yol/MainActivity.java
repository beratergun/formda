package io.github.beratergun.yol;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    registerPlugin(CapturePermissionsPlugin.class);
    super.onCreate(savedInstanceState);
  }
}
