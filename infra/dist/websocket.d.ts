import { Construct } from "constructs";
import { aws_lambda as lambda } from "aws-cdk-lib";
import * as agw from "aws-cdk-lib/aws-apigatewayv2";
interface WebSocketProps {
    websocketHandler: lambda.IFunction;
    authHandler: lambda.IFunction;
    /**
     * The querystring key for setting Cognito idToken.
     */
    querystringKeyForIdToken?: string;
}
export declare class WebSocket extends Construct {
    readonly api: agw.WebSocketApi;
    private readonly defaultStageName;
    constructor(scope: Construct, id: string, props: WebSocketProps);
    get apiEndpoint(): string;
}
export {};
