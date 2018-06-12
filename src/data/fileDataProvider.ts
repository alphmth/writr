import { Config } from "../config";
import {Post} from '../post';
import {Tag} from '../tag';
import {DataProviderInterface}  from './dataProviderInterface';
import * as fs from 'fs-extra';
import * as MarkDownIt from 'markdown-it';
import { Logger, transports } from 'winston';


export class FileDataProvider implements DataProviderInterface {
    __config: Config = new Config();
    __posts: Array<Post> = new Array<Post>();
    __log: any;

    constructor() {
       this.__log = new Logger({transports:[new transports.Console()]});
    }

    async getPost(id:string): Promise<Post | undefined> {
        let result: Post | undefined;

        let posts = await this.getPosts();
    
        posts.forEach(post => {
            
            if(post.id == this.formatToKey(id)) {
                result = post;
            }
        });
    
        return result;
    }

    async getPublishedPost(id:string): Promise<Post | undefined> {
        let result: Post | undefined;

        let posts = await this.getPublishedPosts();

        for(let i=0;i<posts.length;i++)
        {
            let post = posts[i];

            if(post.id == this.formatToKey(id)) {
                result = post;
            }

        }

        return result;
    }

    async getPosts(): Promise<Array<Post>> {
        let result = new Array<Post>();

        if(this.__posts.length == 0) {
            let directory = this.__config.postPath;

            if(await fs.existsSync(directory)) {
                let files = await fs.readdirSync(directory);

                for(let i=0;i<files.length;i++)
                {
                    let file = files[i];

                    if(file.indexOf('.md') > 0) {
                        let filePath = directory + '/' + file;
                        let post = await this.parsePost(filePath);
                            this.__posts.push(post);
                    }
                }
            }
        }

        result = this.__posts;

        return result;
    }

    async getPublishedPosts(): Promise<Array<Post>> {
        let result = new Array<Post>();

        let posts = await this.getPosts();

        for(let i=0;i<posts.length;i++)
        {
            let post = posts[i];

            if(post.isPublished()) {
                result.push(post);
            }
        }

        return result;
    }

    async getTag(name:string) : Promise<Tag | undefined> {
        let result;

        let tags = await this.getTags();

        for(let i=0;i<tags.length;i++)
        {
            let tag = tags[i];

            if(this.formatToKey(tag.name) == this.formatToKey(name)) {
                result = tag;
            }
        }

        return result;
    }
    
    async getPublishedTag(name:string): Promise<Tag | undefined> {
        let result;

        let tags = await this.getPublishedTags();

        for(let i=0;i<tags.length;i++)
        {
            let tag = tags[i];

            if(this.formatToKey(tag.name) == this.formatToKey(name)) {
                result = tag;
            }

        }

        return result;
    }

    async getTags(): Promise<Array<Tag>> {
        let posts = await this.getPosts();

        return this.generateTags(posts);
    }

    async getPublishedTags(): Promise<Array<Tag>> {
        let posts = await this.getPublishedPosts();

        return this.generateTags(posts);
    }

    generateTags(posts: Array<Post>): Array<Tag> {
    
        let result = new Array<Tag>();
    
        posts.forEach( post => {
            post.tags.forEach( tagName => {
                
                let tag = null;
    
                result.forEach(t => {
                    if(this.formatToKey(t.name) == this.formatToKey(tagName)) {
                        tag = t;
                    }
                });
    
                if(tag == null) {
                    tag = new Tag(this.formatToKey(tagName));
                    result.push(tag);
                }
    
                let postExists : boolean = false;
    
                tag.posts.forEach(p => {
                    if(this.formatToKey(p.title) == this.formatToKey(post.title)) {
                        postExists = true;
                    }
                })
    
                if(!postExists) {
                    tag.posts.push(post);
                }
            
            });
        });
    
        return result;
    }

    init(config:Config): void {
        this.__config = config;
    }

    formatToKey(key:string): string {
        return key.toLowerCase().trim();
    }

    async parsePost(filePath:string): Promise<Post> {
        let result: Post = new Post();

        try {
            if(fs.existsSync(filePath)) {
                let buff = await fs.readFile(filePath);
                
                let data = buff.toString();

                result.header = data.split('}')[0] + '}';

                result.content = data.substr(data.indexOf('}')+1);

                //clean up header
                result.header = result.header.replace('\n', '');

                let parser = require('parse-json');

                //setup the header
                let headerObj = parser(result.header);

                result.title = headerObj.title;

                if(headerObj.author) {
                    result.author = headerObj.author;
                }

                if(headerObj.url) {
                    result.url = headerObj.url;
                } else {
                    result.url = result.title.toLowerCase().trim().split(' ').join('-');
                }

                if(headerObj.createdAt) {
                    result.createdAt = new Date(headerObj.createdAt);
                }
                
                if(headerObj.publishedAt) {
                    result.publishedAt = new Date(headerObj.publishedAt);
                }

                if(headerObj.keywords) {
                    result.keywords = headerObj.keywords.toString().split(',');
                }

                if(headerObj.tags) {
                    result.tags = headerObj.tags.toString().split(',');
                }

                if(headerObj.previewKey) {
                    result.previewKey = headerObj.previewKey;
                }

                //generate html from markdown
                let markdown = new MarkDownIt();
                result.body = markdown.render(result.content);


            } else {
                this.__log.error('The following post does not exist: '+  filePath);
            }
        }
        catch(error) {
            this.__log.error(error);
            throw new Error(error);
        }

        return result;
    }

}