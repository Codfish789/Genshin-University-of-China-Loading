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
            // 获取当前URL的pathname
            const currentPath = window.location.pathname;
            console.log('Current path:', currentPath);
            console.log('Current full URL:', window.location.href);
            
            // 优先级1: 检测API中的网站列表 (host/*)
            // 提取路径中的第一个部分作为可能的name
            const pathParts = currentPath.split('/').filter(part => part.length > 0);
            console.log('Path parts:', pathParts);
            
            // 对第一个路径段进行URL解码
            const potentialName = pathParts[0] ? decodeURIComponent(pathParts[0]) : '';
            console.log('Potential name (decoded):', potentialName);
            
            if (potentialName) {
                try {
                    console.log('Fetching API data...');
                    const response = await fetch('https://api.guc.edu.kg/list.json', {
                        method: 'GET',
                        mode: 'cors',
                        headers: {
                            'Accept': 'application/json',
                        }
                    });
                    console.log('API response status:', response.status);
                    
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    
                    const data = await response.json();
                    console.log('API data:', data);
                    
                    // 查找name匹配的网站
                    const matchedWebsite = data.websites.find((website: any) => {
                        console.log('Comparing:', website.name, 'with', potentialName);
                        return website.name === potentialName;
                    });
                    
                    if (matchedWebsite) {
                        console.log('Found matching website by name:', matchedWebsite.name);
                        console.log('Redirecting to:', matchedWebsite.url.trim());
                        // 使用setTimeout确保跳转能够执行
                        setTimeout(() => {
                            window.location.href = matchedWebsite.url.trim();
                        }, 100);
                        return;
                    } else {
                        console.log('No matching website found in API data');
                    }
                } catch (apiError) {
                    console.error('API request failed:', apiError);
                    console.warn('API request failed, continuing to next priority:', apiError);
                }
            } else {
                console.log('No potential name found in path');
            }
            
            // 优先级2: 检测 /s/* 路径
            if (currentPath.startsWith('/s/')) {
                console.log('Detected /s/ path');
                // 提取 /s/ 后面的部分作为目标URL
                const targetUrl = currentPath.substring(3); // 去掉 '/s/' 前缀
                console.log('Target URL from /s/ path:', targetUrl);
                
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
                    setTimeout(() => {
                        window.location.href = finalUrl;
                    }, 100);
                    return;
                }
            } else {
                console.log('Path does not start with /s/');
            }
            
            // 优先级3: 默认跳转（只有在前面两个优先级都失败时才执行）
            console.log('Using default redirect');
            setTimeout(() => {
                window.location.href = 'https://www.guc.edu.kg/';
            }, 100);
            
        } catch (error) {
            // 如果所有方法都失败，使用默认跳转
            console.error('All redirect methods failed:', error);
            setTimeout(() => {
                window.location.href = 'https://www.guc.edu.kg/';
            }, 100);
        }
    }
    
    public task(handle: Function | Promise<any>, props = {}) {
        return this.taskManger.task(handle, props);
    }
}

export const gameManager = new GameManager();