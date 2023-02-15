import { Construct } from "constructs";
import { Duration, Stack, StackProps } from "aws-cdk-lib";
import { IVpc, Port, SecurityGroup, SubnetType } from "aws-cdk-lib/aws-ec2";
import { Code, Function, IFunction, Runtime } from "aws-cdk-lib/aws-lambda";
import { IRule, Rule, Schedule } from "aws-cdk-lib/aws-events";
import { LambdaFunction } from "aws-cdk-lib/aws-events-targets";
import { CustomDatabase } from "../constructs/custom-database";

interface DeleteOldEventsStackProps extends StackProps {
  database: CustomDatabase,
  databaseEnvironment: {[key: string]: string}
  interval: string
  prefix: string
  vpc: IVpc
}

export class DeleteOldEventsStack extends Stack {
  readonly lambda: IFunction
  readonly rule: IRule
  readonly securityGroup: SecurityGroup

  constructor(scope: Construct, id: string, props: DeleteOldEventsStackProps) {
    super(scope, id, props);

    this.securityGroup = new SecurityGroup(this, 'DeleteOldEventsSecurityGroup', {
      securityGroupName: `${props.prefix}DeleteOldEventsSecurityGroup`,
      vpc: props.vpc
    });
    props.database.addIngressRule(this.securityGroup, Port.tcp(5432), "from DeleteOldEvents lambda", true);

    this.lambda = new Function(this, "DeleteOldEventsFunction", {
      functionName: `${props.prefix}-DeleteOldEventsLambda`,
      code: Code.fromAsset("dist/lambdas/DeleteOldEventsLambda"),
      handler: "index.DeleteOldEventsLambda",
      runtime: Runtime.NODEJS_16_X,
      environment: {
        INTERVAL: props.interval,
        ...props.databaseEnvironment
      },
      memorySize: 1024,
      timeout: Duration.seconds(5),
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: SubnetType.PRIVATE_ISOLATED
      }
    });

    // Grant the lambda connection abilities to the database
    props.database.grantConnectFromLambda(this, this.lambda);

    // Invoke the lambda every day to remove interval old events
    this.rule = new Rule(this, "DeleteOldEventsRule", {
      description: "Scheduled rule for deleting old events",
      ruleName: `${props.prefix}-DeleteOldEventsRule`,
      schedule: Schedule.cron({
        minute: "0",
        hour: "0",
      }),
      targets: [new LambdaFunction(this.lambda)]
    });
  }
}
