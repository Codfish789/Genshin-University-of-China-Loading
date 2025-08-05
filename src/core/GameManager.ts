import { EventEmitter, MathUtils } from "../libs/xviewer";

class TaskManager {
    private _taskCount: number = 0;
    private _taskFinished: number = 0;
    private _resolve: Promise<void> = Promise.resolve();
    private _progress: number = 0;

    public get progress() {
        return this._progress;
    }

    public task(handle: Function | Promise<any>, { name = "", weight = 1 } = {}) {
        this._regist(weight);
        return this._resolve
            .then(() => typeof handle === "function" ? handle() : handle)
            .then(() => this._finish(weight, name))
            .catch(err => {
                this._finish(weight, name);
                console.error(err);
            });
    }

    public reset() {
        this._taskCount = 0;
        this._taskFinished = 0;
        this._progress = 0;
    }

    private _finish(w: number, name: string) {
        this._taskFinished += w;
        this._progress = MathUtils.clamp01(Math.max(this._progress, this._taskFinished / this._taskCount))
    }

    private _regist(w: number) {
        this._taskCount = Math.max(1, this._taskCount + w);
    }
}

class GameManager extends EventEmitter {
    public taskManger: TaskManager = new TaskManager();
    public restartCount: number = 0;

    public reset() {
        this.clear();
        this.taskManger.reset();
        this.taskManger = new TaskManager();
    }

    public get progress() {
        return this.taskManger.progress;
    }

    public restart() {
        // 触发显示中间页面的事件，而不是直接跳转
        this.emit("show-intermediate-page");
    }
    
    public async confirmRestart() {
        try {
            // 获取当前URL的host和pathname
            const currentHost = window.location.host;
            const currentPath = window.location.pathname;
            
            // 优先级1: 检测API中的网站列表
            try {
                const response = await fetch('https://api.guc.edu.kg/list.json');
                const data = await response.json();
                
                // 查找匹配的网站
                const matchedWebsite = data.websites.find((website: any) => {
                    try {
                        const websiteUrl = new URL(website.url.trim());
                        return websiteUrl.host === currentHost;
                    } catch (error) {
                        console.warn('Invalid URL in website data:', website.url);
                        return false;
                    }
                });
                
                if (matchedWebsite) {
                    console.log('Found matching website from API:', matchedWebsite.name);
                    window.location.href = matchedWebsite.url.trim();
                    return;
                }
            } catch (apiError) {
                console.warn('API request failed, continuing to next priority:', apiError);
            }
            
            // 优先级2: 检测 /s/* 路径
            if (currentPath.startsWith('/s/')) {
                // 提取 /s/ 后面的部分作为目标URL
                const targetUrl = currentPath.substring(3); // 去掉 '/s/' 前缀
                
                if (targetUrl) {
                    // 检查是否是完整的URL（包含协议）
                    let finalUrl;
                    if (targetUrl.startsWith('http://') || targetUrl.startsWith('https://')) {
                        finalUrl = targetUrl;
                    } else {
                        // 如果没有协议，默认添加 https://
                        finalUrl = 'https://' + targetUrl;
                    }
                    
                    console.log('Redirecting via /s/ path to:', finalUrl);
                    window.location.href = finalUrl;
                    return;
                }
            }
            
            // 优先级3: 默认跳转
            console.log('Using default redirect');
            window.location.href = 'https://www.guc.edu.kg/';
            
        } catch (error) {
            // 如果所有方法都失败，使用默认跳转
            console.error('All redirect methods failed:', error);
            window.location.href = 'https://www.guc.edu.kg/';
        }
    }
    
    public task(handle: Function | Promise<any>, props = {}) {
        return this.taskManger.task(handle, props);
    }
}

export const gameManager = new GameManager();