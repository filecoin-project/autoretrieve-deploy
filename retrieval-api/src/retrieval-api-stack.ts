import { LambdaIntegration, RestApi } from "@aws-cdk/aws-apigateway";
import { CfnOutput, Construct, Duration, Stack, StackProps } from "@aws-cdk/core";
import { Code, Function, Runtime } from "@aws-cdk/aws-lambda";

export class RetrievalApiStack extends Stack {

  constructor(scope: Construct, id: string, _props: RetrievalApiStackProps) {
    super(scope, id);

    const prefix = "retrieval-api-";

    const saveRetrievalEventLambda = new Function(this, "SaveRetrievalEventLambda", {
      functionName: `${prefix}-SaveRetrievalEvent`,
      code: Code.fromAsset("dist/lambdas/SaveRetrievalEventLambda"),
      handler: "index.SaveRetrievalEventLambda",
      runtime: Runtime.NODEJS_16_X,
      environment: {

      },
      memorySize: 1024,
      timeout: Duration.seconds(5)
    });

    const api = new RestApi(this, "RetrievalApi");
    new CfnOutput(this, "apiUrl", {value: api.url});

    const retrievalsResource = api.root.addResource("retrieval-events");
    const retrievalIdResource = retrievalsResource.addResource("{id}");
    const resourceFunction = new LambdaIntegration(saveRetrievalEventLambda);

    retrievalIdResource.addMethod("POST", resourceFunction);
  }
}

interface RetrievalApiStackProps extends StackProps {

}