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
