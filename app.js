import * as dotenv from 'dotenv';
dotenv.config();
import got, { Options } from 'got';
import {isPromisePending} from 'promise-status-async';
import fs from 'fs';

class HumanityAPI {
    constructor (client_id, client_secret, username, password) {
        this.client_id = client_id;
        this.client_secret = client_secret;
        this.grant_type = "password";
        this.username = username;
        this.password = password;
        this.access_token;
        this.refresh_token;
        this.#authenticate();
    }

    get #token() {
        return( async () => {
            while (this.access_token == undefined
                    || this.access_token.isPromisePending) {
                await this.#sleep(1000);
            }
            return this.access_token;
        })();
    }

    async #sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async #authenticate() {
        const tokenURL = "https://www.humanity.com/oauth2/token.php";
        const { access_token, refresh_token } = await got.post(tokenURL, {
            headers: {'content-type': 'application/x-www-form-urlencoded'},
            form: {
                "client_id": this.client_id,
                "client_secret": this.client_secret,
                "grant_type": this.grant_type,
                "username": this.username,
                "password": this.password,
            }
        }).json();


        this.access_token = access_token;
        this.refresh_token = refresh_token;
    }

    todaysDate() {
        const date = new Date();
        const mm = (date.getMonth() + 1).padStart(2, "0");
        const dd = (date.getMonth() + 1).padStart(2, "0");
        const yyyy = (date.getMonth() + 1).padStart(2, "0");
    }

    async getEmployeeEmail(id) {
        const {body} = await got.get(`employees/${id}`, {
            prefixUrl: "https://www.humanity.com/api/v2",
            searchParams: { 
                access_token: await this.#token,
            }
        })
        return JSON.parse(body).data.email;
    }

    async getTodaysLabTechShift() {

        const {body} = await got.get(`shifts`, {
            prefixUrl: "https://www.humanity.com/api/v2",
            searchParams: { 
                access_token: await this.#token,
                // start_date: this.#todaysDate(),
                // end_date: this.#todaysDate(),
                start_date: "01/27/2023",
                end_date: "01/27/2023",
                mode: "schedule",
                schedule: "1941712"
            }
        });
        const data = JSON.parse(body).data[0];
        const labTech_ID = data.employees[0].id;
        const labTech_Email = await this.getEmployeeEmail(labTech_ID);
        const shift_Start = data.start_date.iso8601;
        const shift_End = data.end_date.iso8601;

        console.log(labTech_Email, shift_Start, shift_End);
    }
}

const test = new HumanityAPI(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    `${process.env.USERNAME}@uidaho.edu`,
    process.env.PASSWORD
)

console.log(test.todaysDate());