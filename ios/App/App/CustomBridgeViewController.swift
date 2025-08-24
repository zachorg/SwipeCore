import UIKit
import Capacitor

class CustomBridgeViewController: CAPBridgeViewController {
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        // Add error handling for web view
        webView?.navigationDelegate = self
        
        // Set up error handling for Capacitor
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleCapacitorError),
            name: NSNotification.Name("capacitorError"),
            object: nil
        )
    }
    
    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        
        // Ensure proper view setup
        if webView == nil {
            print("Warning: WebView is nil, attempting to recreate")
            setupWebView()
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
    
    private func setupWebView() {
        // Recreate web view if needed
        let webView = WKWebView()
        webView.navigationDelegate = self
        self.webView = webView
    }
    
    deinit {
        NotificationCenter.default.removeObserver(self)
    }
}

// MARK: - WKNavigationDelegate
extension CustomBridgeViewController: WKNavigationDelegate {
    
    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        print("WebView failed to load: \(error.localizedDescription)")
        
        // Handle loading failures gracefully
        if let urlError = error as? URLError {
            switch urlError.code {
            case .notConnectedToInternet:
                print("No internet connection")
            case .timedOut:
                print("Request timed out")
            default:
                print("Other URL error: \(urlError.code)")
            }
        }
    }
    
    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        print("WebView navigation failed: \(error.localizedDescription)")
    }
    
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        print("WebView loaded successfully")
    }
}
