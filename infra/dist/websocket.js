"use strict";
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocket = void 0;
const constructs_1 = require("constructs");
const agw = __importStar(require("aws-cdk-lib/aws-apigatewayv2"));
const agwi = __importStar(require("aws-cdk-lib/aws-apigatewayv2-integrations"));
const agwa = __importStar(require("aws-cdk-lib/aws-apigatewayv2-authorizers"));
class WebSocket extends constructs_1.Construct {
    constructor(scope, id, props) {
        var _a;
        super(scope, id);
        this.defaultStageName = "prod";
        const authorizer = new agwa.WebSocketLambdaAuthorizer("WebSocketAuthorizer", props.authHandler, {
            identitySource: [`route.request.querystring.${(_a = props.querystringKeyForIdToken) !== null && _a !== void 0 ? _a : "idToken"}`],
        });
        this.api = new agw.WebSocketApi(this, "WebSocketApi", {
            connectRouteOptions: {
                authorizer,
                integration: new agwi.WebSocketLambdaIntegration("ConnectIntegration", props.websocketHandler),
            },
            disconnectRouteOptions: {
                integration: new agwi.WebSocketLambdaIntegration("DisconnectIntegration", props.websocketHandler),
            },
            defaultRouteOptions: {
                integration: new agwi.WebSocketLambdaIntegration("DefaultIntegration", props.websocketHandler),
            },
        });
        new agw.WebSocketStage(this, `Stage`, {
            webSocketApi: this.api,
            stageName: this.defaultStageName,
            autoDeploy: true,
        });
    }
    get apiEndpoint() {
        return `${this.api.apiEndpoint}/${this.defaultStageName}`;
    }
}
exports.WebSocket = WebSocket;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2Vic29ja2V0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vd2Vic29ja2V0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxxRUFBcUU7QUFDckUsaUNBQWlDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVqQywyQ0FBdUM7QUFFdkMsa0VBQXFEO0FBQ3JELGdGQUFrRTtBQUNsRSwrRUFBaUU7QUFXakUsTUFBYSxTQUFVLFNBQVEsc0JBQVM7SUFJdEMsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUFxQjs7UUFDN0QsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQztRQUhGLHFCQUFnQixHQUFHLE1BQU0sQ0FBQztRQUt6QyxNQUFNLFVBQVUsR0FBRyxJQUFJLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxxQkFBcUIsRUFBRSxLQUFLLENBQUMsV0FBVyxFQUFFO1lBQzlGLGNBQWMsRUFBRSxDQUFDLDZCQUE2QixNQUFBLEtBQUssQ0FBQyx3QkFBd0IsbUNBQUksU0FBUyxFQUFFLENBQUM7U0FDN0YsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLGNBQWMsRUFBRTtZQUNwRCxtQkFBbUIsRUFBRTtnQkFDbkIsVUFBVTtnQkFDVixXQUFXLEVBQUUsSUFBSSxJQUFJLENBQUMsMEJBQTBCLENBQUMsb0JBQW9CLEVBQUUsS0FBSyxDQUFDLGdCQUFnQixDQUFDO2FBQy9GO1lBQ0Qsc0JBQXNCLEVBQUU7Z0JBQ3RCLFdBQVcsRUFBRSxJQUFJLElBQUksQ0FBQywwQkFBMEIsQ0FBQyx1QkFBdUIsRUFBRSxLQUFLLENBQUMsZ0JBQWdCLENBQUM7YUFDbEc7WUFDRCxtQkFBbUIsRUFBRTtnQkFDbkIsV0FBVyxFQUFFLElBQUksSUFBSSxDQUFDLDBCQUEwQixDQUFDLG9CQUFvQixFQUFFLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQzthQUMvRjtTQUNGLENBQUMsQ0FBQztRQUVILElBQUksR0FBRyxDQUFDLGNBQWMsQ0FBQyxJQUFJLEVBQUUsT0FBTyxFQUFFO1lBQ3BDLFlBQVksRUFBRSxJQUFJLENBQUMsR0FBRztZQUN0QixTQUFTLEVBQUUsSUFBSSxDQUFDLGdCQUFnQjtZQUNoQyxVQUFVLEVBQUUsSUFBSTtTQUNqQixDQUFDLENBQUM7SUFDTCxDQUFDO0lBRUQsSUFBSSxXQUFXO1FBQ2IsT0FBTyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsV0FBVyxJQUFJLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO0lBQzVELENBQUM7Q0FDRjtBQWxDRCw4QkFrQ0MiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgQW1hem9uLmNvbSwgSW5jLiBvciBpdHMgYWZmaWxpYXRlcy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vIFNQRFgtTGljZW5zZS1JZGVudGlmaWVyOiBNSVQtMFxuXG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tIFwiY29uc3RydWN0c1wiO1xuaW1wb3J0IHsgYXdzX2xhbWJkYSBhcyBsYW1iZGEgfSBmcm9tIFwiYXdzLWNkay1saWJcIjtcbmltcG9ydCAqIGFzIGFndyBmcm9tICBcImF3cy1jZGstbGliL2F3cy1hcGlnYXRld2F5djJcIjtcbmltcG9ydCAqIGFzIGFnd2kgZnJvbSBcImF3cy1jZGstbGliL2F3cy1hcGlnYXRld2F5djItaW50ZWdyYXRpb25zXCI7XG5pbXBvcnQgKiBhcyBhZ3dhIGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtYXBpZ2F0ZXdheXYyLWF1dGhvcml6ZXJzXCI7XG5cbmludGVyZmFjZSBXZWJTb2NrZXRQcm9wcyB7XG4gIHdlYnNvY2tldEhhbmRsZXI6IGxhbWJkYS5JRnVuY3Rpb247XG4gIGF1dGhIYW5kbGVyOiBsYW1iZGEuSUZ1bmN0aW9uO1xuICAvKipcbiAgICogVGhlIHF1ZXJ5c3RyaW5nIGtleSBmb3Igc2V0dGluZyBDb2duaXRvIGlkVG9rZW4uXG4gICAqL1xuICBxdWVyeXN0cmluZ0tleUZvcklkVG9rZW4/OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBjbGFzcyBXZWJTb2NrZXQgZXh0ZW5kcyBDb25zdHJ1Y3Qge1xuICByZWFkb25seSBhcGk6IGFndy5XZWJTb2NrZXRBcGk7XG4gIHByaXZhdGUgcmVhZG9ubHkgZGVmYXVsdFN0YWdlTmFtZSA9IFwicHJvZFwiO1xuXG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzOiBXZWJTb2NrZXRQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCk7XG5cbiAgICBjb25zdCBhdXRob3JpemVyID0gbmV3IGFnd2EuV2ViU29ja2V0TGFtYmRhQXV0aG9yaXplcihcIldlYlNvY2tldEF1dGhvcml6ZXJcIiwgcHJvcHMuYXV0aEhhbmRsZXIsIHtcbiAgICAgIGlkZW50aXR5U291cmNlOiBbYHJvdXRlLnJlcXVlc3QucXVlcnlzdHJpbmcuJHtwcm9wcy5xdWVyeXN0cmluZ0tleUZvcklkVG9rZW4gPz8gXCJpZFRva2VuXCJ9YF0sXG4gICAgfSk7XG5cbiAgICB0aGlzLmFwaSA9IG5ldyBhZ3cuV2ViU29ja2V0QXBpKHRoaXMsIFwiV2ViU29ja2V0QXBpXCIsIHtcbiAgICAgIGNvbm5lY3RSb3V0ZU9wdGlvbnM6IHtcbiAgICAgICAgYXV0aG9yaXplcixcbiAgICAgICAgaW50ZWdyYXRpb246IG5ldyBhZ3dpLldlYlNvY2tldExhbWJkYUludGVncmF0aW9uKFwiQ29ubmVjdEludGVncmF0aW9uXCIsIHByb3BzLndlYnNvY2tldEhhbmRsZXIpLFxuICAgICAgfSxcbiAgICAgIGRpc2Nvbm5lY3RSb3V0ZU9wdGlvbnM6IHtcbiAgICAgICAgaW50ZWdyYXRpb246IG5ldyBhZ3dpLldlYlNvY2tldExhbWJkYUludGVncmF0aW9uKFwiRGlzY29ubmVjdEludGVncmF0aW9uXCIsIHByb3BzLndlYnNvY2tldEhhbmRsZXIpLFxuICAgICAgfSxcbiAgICAgIGRlZmF1bHRSb3V0ZU9wdGlvbnM6IHtcbiAgICAgICAgaW50ZWdyYXRpb246IG5ldyBhZ3dpLldlYlNvY2tldExhbWJkYUludGVncmF0aW9uKFwiRGVmYXVsdEludGVncmF0aW9uXCIsIHByb3BzLndlYnNvY2tldEhhbmRsZXIpLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIG5ldyBhZ3cuV2ViU29ja2V0U3RhZ2UodGhpcywgYFN0YWdlYCwge1xuICAgICAgd2ViU29ja2V0QXBpOiB0aGlzLmFwaSxcbiAgICAgIHN0YWdlTmFtZTogdGhpcy5kZWZhdWx0U3RhZ2VOYW1lLFxuICAgICAgYXV0b0RlcGxveTogdHJ1ZSxcbiAgICB9KTtcbiAgfVxuXG4gIGdldCBhcGlFbmRwb2ludCgpIHtcbiAgICByZXR1cm4gYCR7dGhpcy5hcGkuYXBpRW5kcG9pbnR9LyR7dGhpcy5kZWZhdWx0U3RhZ2VOYW1lfWA7XG4gIH1cbn0iXX0=