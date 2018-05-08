import * as fs from 'fs';
import { Logger, transports } from 'winston';
import * as MarkDownIt from 'markdown-it';



export class Post {
    title: string = '';
    author: string = '';
    url: string = '';
    createdAt: Date = new Date();
    publishedAt: Date = new Date() ;
    keywords: Array<string> = [];
    tags: Array<string> = [];
    content: string = '';
    body: string = '';
    header: string = '';
    filePath: string = '';
    log: any;

    constructor(filePath: string) {
        this.log = new Logger({transports:[new transports.Console()]});
        
        this.filePath = filePath;

        this.parse(this.filePath);
    }

    parse(filePath: string) {

        try {
            if(fs.existsSync(filePath)) {
                let data = fs.readFileSync(filePath).toString();

                this.header = data.split('}')[0] + '}';

                this.content = data.substr(data.indexOf('}')+1);

                //clean up header
                this.header = this.header.replace('\n', '');

                let parser = require('parse-json');

                //setup the header
                let headerObj = parser(this.header);

                this.title = headerObj.title;

                if(headerObj.author) {
                    this.author = headerObj.author;
                }

                if(headerObj.url) {
                    this.url = headerObj.url;
                } else {
                    this.url = this.title.toLowerCase().trim().split(' ').join('-');
                }

                if(headerObj.createdAt) {
                    this.createdAt = new Date(headerObj.createdAt);
                }
                
                if(headerObj.publishedAt) {
                    this.publishedAt = new Date(headerObj.publishedAt);
                }

                if(headerObj.keywords) {
                    this.keywords = headerObj.keywords.toString().split(',');
                }

                if(headerObj.tags) {
                    this.tags = headerObj.tags.toString().split(',');
                }

                //generate html from markdown
                let markdown = new MarkDownIt();
                this.body = markdown.render(this.content);


            } else {
                this.log.error('The following post does not exist: '+  filePath);
            }
        }
        catch(error) {
            this.log.error(error);
            throw new Error(error);
        }
        
    }

    isPostPublished(): Boolean {
        let result = false;
        
        if(!this.publishedAt) {
            result = true;
        }

        if(this.publishedAt) {
            if(this.publishedAt <= new Date()) {
                result = true;
            }
        }

        return result;
    }

    
}