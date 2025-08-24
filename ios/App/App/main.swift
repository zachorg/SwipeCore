import UIKit

// Global exception handler to prevent crashes
func handleException(_ exception: NSException) {
    print("Exception caught: \(exception)")
    print("Exception name: \(exception.name)")
    print("Exception reason: \(exception.reason ?? "Unknown")")
    print("Exception callStackSymbols: \(exception.callStackSymbols)")
}

// Set up global exception handling
NSSetUncaughtExceptionHandler(handleException)

// Main entry point with error handling
UIApplicationMain(
    CommandLine.argc,
    CommandLine.unsafeArgv,
    NSStringFromClass(UIApplication.self),
    NSStringFromClass(AppDelegate.self)
)
