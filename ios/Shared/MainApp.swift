//
//  MainApp.swift
//  Shared
//
//  Created by 黃孟遠 on 2021/7/13.
//

import SwiftUI

@main
struct MainApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) var appDelegate
    @Environment(\.scenePhase) var scenePhase
    
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
        .onChange(of: scenePhase) { scenePhase in
            switch scenePhase {
            case .active:
                guard let shortcutItem = appDelegate.shortcutItem else { return }
                if let shortcutUrl = URL.init(string: shortcutItem.type) {
                    webViewShared?.evaluateJavaScript("location.href = '\(shortcutUrl)'");
                }
            default: return
            }
        }
    }
}
