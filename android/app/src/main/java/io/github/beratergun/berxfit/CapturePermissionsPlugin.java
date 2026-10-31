package io.github.beratergun.berxfit;

import android.Manifest;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

@CapacitorPlugin(name = "CapturePermissions", permissions = {
  @Permission(alias = "camera", strings = { Manifest.permission.CAMERA }),
  @Permission(alias = "microphone", strings = { Manifest.permission.RECORD_AUDIO })
})
public class CapturePermissionsPlugin extends Plugin {
  @PluginMethod
  public void request(PluginCall call) {
    boolean microphone = Boolean.TRUE.equals(call.getBoolean("microphone", false));
    if (getPermissionState("camera") == PermissionState.GRANTED &&
        (!microphone || getPermissionState("microphone") == PermissionState.GRANTED)) {
      permissionsResult(call);
      return;
    }
    requestPermissionForAliases(microphone ? new String[] { "camera", "microphone" } : new String[] { "camera" }, call, "permissionsResult");
  }

  @PermissionCallback
  private void permissionsResult(PluginCall call) {
    JSObject result = new JSObject();
    result.put("camera", getPermissionState("camera") == PermissionState.GRANTED);
    result.put("microphone", getPermissionState("microphone") == PermissionState.GRANTED);
    call.resolve(result);
  }
}
