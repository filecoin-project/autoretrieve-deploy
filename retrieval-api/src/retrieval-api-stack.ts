import { RestApi } from "@aws-cdk/aws-apigateway";
import { Construct, Duration, Stack, StackProps } from "@aws-cdk/core";
import { AssetCode, Code, Function, Runtime } from "@aws-cdk/aws-lambda";

export class RetrievalApiStack extends Stack {

  constructor(scope: Construct, id: string, props: RetreivalApiStackProps) {
    super(scope, id);

    const prefix = "retrieval-api-";

    const saveProviderRetrievalLambda = new Function(this, "SaveProviderRetrievalLambda", {
      code: Code.fromAsset("dist/lambdas/SaveProviderRetreivalLambda"),
      handler: "index.SaveProviderRetrievalLambda",
      runtime: Runtime.NODEJS_16_X,
      environment: {

      },
      memorySize: 1024,
      timeout: Duration.seconds(5)
    });

    const api = new RestApi(this, "RetrievalApi");
    const retrievalsResource = api.root.addResource("retrievals");
    
  }
}

interface RetreivalApiStackProps extends StackProps {

}