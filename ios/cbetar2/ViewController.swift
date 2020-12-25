//
//  ViewController.swift
//  cbetar2
//
//  Created by Roger Huang on 2020/12/24.
//

import UIKit
import WebKit
import SnapKit

class ViewController: UIViewController {
    
    let jsonUriPrefix = "data:text/json;charset=utf-8,"
    let baseURL = URL(string: "http://localhost:3000")!
    //let baseURL = URL(string: "https://mrrogerhuang.github.io")!
    //let baseURL = URL(string: "https://mrmyhuang.github.io")!
    
    let contentController = WKUserContentController();
    let swiftCallbackHandler = "swiftCallbackHandler"
    
    lazy var webView: WKWebView = {
        let preferences = WKPreferences()
        preferences.setValue(true, forKey: "allowFileAccessFromFileURLs")
        
        let configuration = WKWebViewConfiguration()
        configuration.preferences = preferences
        configuration.defaultWebpagePreferences.allowsContentJavaScript = true
        configuration.limitsNavigationsToAppBoundDomains = true
        configuration.userContentController = contentController
        
        let webView = WKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = self
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        
        let websiteDataTypes = NSSet(array: [WKWebsiteDataTypeDiskCache, WKWebsiteDataTypeMemoryCache])
        let date = NSDate(timeIntervalSince1970: 0)
        
        WKWebsiteDataStore.default().removeData(ofTypes: websiteDataTypes as! Set<String>, modifiedSince: date as Date, completionHandler:{ })
        
        return webView
    }()
    
    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
    }
    
    override func viewDidLoad() {
        super.viewDidLoad()
        contentController.add(self, name: swiftCallbackHandler)
        view.addSubview(webView)
        webView.snp.makeConstraints {
            //$0.edges.equalToSuperview()
            $0.top.equalTo(self.view.safeAreaLayoutGuide.snp.topMargin)
            $0.leading.trailing.bottom.equalToSuperview()
        }
        webView.load(URLRequest(url: baseURL))
    }
    
    var fileURL: URL?
    private func saveText(text: String, file: String) {
        if let dir = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first {
            fileURL = dir.appendingPathComponent(file)
            do {
                try text.write(to: fileURL!, atomically: false, encoding: .utf8)
                let controller = UIDocumentPickerViewController(forExporting: [fileURL!])
                controller.delegate = self
                present(controller, animated: true)
            }
            catch {/* error handling here */}
        }
    }
}

extension ViewController: UIDocumentPickerDelegate {
    func documentPicker(_ controller: UIDocumentPickerViewController, didPickDocumentsAt urls: [URL]) {
        try? FileManager.default.removeItem(at: fileURL! )
    }
}

extension ViewController: WKScriptMessageHandler {
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard let dict = message.body as? Dictionary<String, Any> else { return }
        guard let event = dict["event"] as? String else { return }
        
        if(event == "copy") {
            let text = dict["text"] as? String ?? ""
            UIPasteboard.general.string = text
        }
    }
}

extension ViewController: WKNavigationDelegate {
    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        if navigationAction.navigationType == .linkActivated  {
            if let url = navigationAction.request.url {
                if url.absoluteString.contains(jsonUriPrefix) {
                    if let dataStr = url.absoluteString.replacingOccurrences(of: jsonUriPrefix, with: "").removingPercentEncoding {
                        saveText(text: dataStr, file: "Settings.json")
                        decisionHandler(.cancel)
                        return
                    }
                } else if let host = url.host, !host.hasPrefix(baseURL.host!), UIApplication.shared.canOpenURL(url) {
                    UIApplication.shared.open(url)
                    decisionHandler(.cancel)
                    return
                }
            }
        }
        
        decisionHandler(.allow)
    }
}
