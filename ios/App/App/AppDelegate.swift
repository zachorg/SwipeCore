import UIKit
import Capacitor

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Set up global exception handling first
        setupExceptionHandling()
        
        // Override point for customization after application launch.
        
        // Ensure the window is properly initialized
        if window == nil {
            window = UIWindow(frame: UIScreen.main.bounds)
        }
        
        // Set up the main view controller with error handling
        do {
            let storyboard = UIStoryboard(name: "Main", bundle: nil)
            if let viewController = storyboard.instantiateInitialViewController() {
                window?.rootViewController = viewController
                window?.makeKeyAndVisible()
            } else {
                print("Warning: Could not instantiate initial view controller")
            }
        } catch {
            print("Error setting up view controller: \(error)")
        }
        
        // Add error handling for Capacitor
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleCapacitorError),
            name: NSNotification.Name("capacitorError"),
            object: nil
        )
        
        // Add system error handling
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleSystemError),
            name: NSNotification.Name("systemError"),
            object: nil
        )
        
        return true
    }
    
    private func setupExceptionHandling() {
        // Set up global exception handler
        NSSetUncaughtExceptionHandler { exception in
            print("Uncaught exception: \(exception)")
            print("Exception name: \(exception.name)")
            print("Exception reason: \(exception.reason ?? "Unknown")")
            print("Exception callStackSymbols: \(exception.callStackSymbols)")
        }
        
        // Set up signal handler for low-level crashes
        signal(SIGSEGV) { signal in
            print("Received signal: \(signal)")
            // Don't exit, just log the signal
        }
        
        signal(SIGBUS) { signal in
            print("Received signal: \(signal)")
            // Don't exit, just log the signal
        }
        
        signal(SIGILL) { signal in
            print("Received signal: \(signal)")
            // Don't exit, just log the signal
        }
    }

    @objc func handleCapacitorError(_ notification: Notification) {
        // Handle any Capacitor-related errors gracefully
        print("Capacitor error handled: \(notification)")
    }
    
    @objc func handleSystemError(_ notification: Notification) {
        // Handle system-level errors
        print("System error handled: \(notification)")
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
        
        // Remove observers to prevent crashes
        NotificationCenter.default.removeObserver(self)
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        // Called when the app was launched with a url. Feel free to add additional processing here,
        // but if you want the App API to support tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        // Called when the app was launched with an activity, including Universal Links.
        // Feel free to add additional processing here, but if you want the App API to support
        // tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

    // Add memory warning handling
    func applicationDidReceiveMemoryWarning(_ application: UIApplication) {
        // Handle memory warnings gracefully
        print("Memory warning received")
        
        // Clear any caches or temporary data
        URLCache.shared.removeAllCachedResponses()
        
        // Force garbage collection if available
        if #available(iOS 13.0, *) {
            // iOS 13+ has automatic memory management
        }
    }

    deinit {
        // Clean up observers
        NotificationCenter.default.removeObserver(self)
    }
}
