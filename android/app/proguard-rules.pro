# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# ============================================================
# Capacitor WebView Rules
# ============================================================

# Keep Capacitor classes
-keep class com.getcapacitor.** { *; }
-keep class de.getstax.app.** { *; }

# WebView JavaScript Interface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep all classes that might be accessed from JavaScript
-keepclassmembers class * {
    @org.xwalk.core.JavascriptInterface <methods>;
}

# ============================================================
# Health Connect Rules
# ============================================================
-keep class androidx.health.connect.client.** { *; }
-keep class androidx.health.platform.client.** { *; }

# ============================================================
# Debugging
# ============================================================

# Keep line numbers for better crash reports
-keepattributes SourceFile,LineNumberTable

# Hide original source file name in stack traces
-renamesourcefileattribute SourceFile

# ============================================================
# General Android Rules
# ============================================================

# Keep native methods
-keepclasseswithmembernames class * {
    native <methods>;
}

# Keep Parcelables
-keepclassmembers class * implements android.os.Parcelable {
    public static final android.os.Parcelable$Creator CREATOR;
}

# Keep Serializable classes
-keepclassmembers class * implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    !static !transient <fields>;
    private void writeObject(java.io.ObjectOutputStream);
    private void readObject(java.io.ObjectInputStream);
    java.lang.Object writeReplace();
    java.lang.Object readResolve();
}
