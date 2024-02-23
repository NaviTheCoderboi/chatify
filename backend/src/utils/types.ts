export type ErrorType = {
    status: number;
    message: string;
};

export type CookieType = {
    expires: Date;
    httpOnly: true;
    secure?: boolean;
};

interface UpdateData {
    [key: string]: {
        set: unknown;
    };
}

export class Data {
    data: UpdateData;

    constructor() {
        this.data = {};
    }

    add(obj: { [key: string]: unknown }, key: string, value: unknown) {
        if (obj[key]) {
            this.data = {
                ...this.data,
                [key]: {
                    set: value,
                },
            };
        }
    }
}
