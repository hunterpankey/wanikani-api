﻿/// <reference path="./typings/promise.d.ts" />

import {
    IApiResponse, IApiInformation, IUserInformation,
    IStudyQueue, ILevelProgress } from './typings/apiTypes';
import { IFetcher, Fetcher } from './fetcher';

interface ICache<T> {
    lastUpdated: number;
    data: T;
}

export interface IWkCache {
    getUserInformation(): Promise<IUserInformation>;
    getStudyQueue(): Promise<IStudyQueue>;
    getLevelProgression(): Promise<ILevelProgress>;
    setExpiry(time: number): void;
}

export class WkCache implements IWkCache {
    private _fetcher: IFetcher;
    private _expiryTime: number = 600; // seconds
    private _userInformation: ICache<IUserInformation> = <ICache<IUserInformation>> {};
    private _studyQueue: ICache<IStudyQueue> = <ICache<IStudyQueue>> {};
    private _levelProgress: ICache<ILevelProgress> = <ICache<ILevelProgress>> {};
    
    constructor(apiKey: string) {
        this._fetcher = new Fetcher(apiKey);
    }
    
    // Returns the cached user information in a promise if still valid.
    // Otherwise, returns a promise containing incoming information
    public getUserInformation(): Promise<IUserInformation> {
        if (this.isValid(this._userInformation)) {
            return Promise.resolve<IUserInformation>(this._userInformation.data);
        }
        return new Promise<IUserInformation>((resolve, reject) => {
            let data = this._fetcher.getData<IApiResponse<IUserInformation>>('user-information');
            data.then((value: IApiResponse<IUserInformation>) => {
                this.setCacheItem(this._userInformation, value);
                resolve(value.userInformation);
            }).catch(() => {
                reject();
            });
        });
    }

    // Returns the cached study queue in a promise if still valid.
    // Otherwise returns a promise containing incoming information.
    public getStudyQueue(): Promise<IStudyQueue> {
        if (this.isValid(this._studyQueue)) {
            return Promise.resolve<IStudyQueue>(this._studyQueue.data);
        }
        return new Promise<IStudyQueue>((resolve, reject) => {
            let data = this._fetcher.getData<IApiResponse<IStudyQueue>>('study-queue');
            data.then((value: IApiResponse<IStudyQueue>) => {
                this.setCacheItem(this._studyQueue, value);
                resolve(value.requestedInformation);
            }).catch(() => {
                reject();
            });
        });
    }

    // Returns the cached level progression in a promise if still valid.
    // Otherwise returns a promise containing the incoming information.
    public getLevelProgression(): Promise<ILevelProgress> {
        if (this.isValid(this._levelProgress)) {
            return Promise.resolve<ILevelProgress>(this._levelProgress.data);
        }
        return new Promise<ILevelProgress>((resolve, reject) => {
            let data = this._fetcher.getData<IApiResponse<ILevelProgress>>('level-progression');
            data.then((value: IApiResponse<ILevelProgress>) => {
                this.setCacheItem(this._levelProgress, value);
                resolve(value.requestedInformation);
            }).catch(() => {
                reject();
            });
        });
    }
    
    // Sets the expiry time in seconds
    public setExpiry(time: number): void {
        this._expiryTime = time;
    }

    private setCacheItem(cacheItem: ICache<{}>, apiItem: IApiResponse<{}>) {
        if (apiItem.requestedInformation) {
            cacheItem.data = apiItem.requestedInformation;
            cacheItem.lastUpdated = this.getTime();
        }

        // always update user information from every request
        if (apiItem.userInformation) {
            this._userInformation = {
                data: apiItem.userInformation,
                lastUpdated: this.getTime()
            };
        }
    }
    
    // Returns if the supplied cache item is still valid
    // based on the current expiry time
    private isValid(cacheItem: ICache<{}>): boolean {
        if (!cacheItem) return false;
        if (!cacheItem.lastUpdated) return false;
        let now = this.getTime();
        let maxValidity = cacheItem.lastUpdated + this._expiryTime;
        return maxValidity > now;
    }
    
    // Returns the current unix epoch time
    private getTime(): number {
        return (new Date()).getTime() / 1000;
    }
}