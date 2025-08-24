import UIKit
import Capacitor

class CustomBridgeViewController: CAPBridgeViewController {
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        // Set up error handling for Capacitor
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleCapacitorError),
            name: NSNotification.Name("capacitorError"),
            object: nil
        )
        
        // Add error handling for view lifecycle
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleViewError),
            name: NSNotification.Name("viewError"),
            object: nil
        )
    }
    
    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        
        // Ensure proper view setup
        if view.window == nil {
            print("Warning: View window is nil, attempting to recover")
        }
    }
    
    @objc func handleCapacitorError(_ notification: Notification) {
        // Handle Capacitor errors gracefully
        print("Capacitor error in bridge view controller: \(notification)")
        
        // Attempt to recover from errors
        if let error = notification.object as? Error {
            print("Error details: \(error.localizedDescription)")
        }
    }
    
    @objc func handleViewError(_ notification: Notification) {
        // Handle view-related errors
        print("View error in bridge view controller: \(notification)")
    }
    
    deinit {
        NotificationCenter.default.removeObserver(self)
    }
}
