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

    let baseURL = URL(string: "https://mrmyhuang.github.io")! //URL(string: "http://localhost:3000")! //
    
    var activity: UIActivityIndicatorView = {
        var view = UIActivityIndicatorView()
        view.transform = CGAffineTransform(scaleX: 5, y: 5)
        view.hidesWhenStopped = true
        return view
    }()
    
    lazy var webView: WKWebView = {
        let preferences = WKPreferences()
        preferences.setValue(true, forKey: "allowFileAccessFromFileURLs")
        
        let configuration = WKWebViewConfiguration()
        configuration.preferences = preferences
        configuration.defaultWebpagePreferences.allowsContentJavaScript = true
        configuration.limitsNavigationsToAppBoundDomains = true
        
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
        view.addSubview(webView)
        webView.snp.makeConstraints {
            $0.edges.equalToSuperview()
        }
        webView.layoutIfNeeded()
        webView.load(URLRequest(url: baseURL))
        webView.evaluateJavaScript("alert(window.innerHeight)", completionHandler: nil)
        
        /*
        webView.addSubview(activity)
        activity.snp.makeConstraints({
            $0.center.equalToSuperview()
        })*/
        
        //activity.startAnimating()
    }
}

extension ViewController: WKNavigationDelegate {
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        activity.stopAnimating()
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        activity.stopAnimating()
    }
}
