import { Construct } from "constructs";
import { CfnOutput, Duration, Stack, StackProps } from "aws-cdk-lib";
import { IVpc } from "aws-cdk-lib/aws-ec2";
import { DatabaseProxy, ProxyTarget } from "aws-cdk-lib/aws-rds";
import { CustomDatabase } from "../constructs/custom-database";

interface DatabaseStackProps extends StackProps {
  proxyBorrowTimeout: Duration
  prefix: string
  vpc: IVpc
}

export class DatabaseStack extends Stack {
  readonly database: CustomDatabase
  readonly proxy: DatabaseProxy

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props);

    // Create the database
    this.database = new CustomDatabase(this, "Database", {
      prefix: props.prefix,
      vpc: props.vpc
    });

    // Output the Database endpoint and secret name
    new CfnOutput(this, "DatabaseEndpoint", {
      value: this.database.database.instanceEndpoint.hostname,
    });
    new CfnOutput(this, "DatabaseSecretName", {
      value: this.database.secret.secretName
    });

    this.proxy = new DatabaseProxy(this, "Proxy", {
      borrowTimeout: props.proxyBorrowTimeout,
      dbProxyName: `${props.prefix}-DatabaseProxy`,
      proxyTarget: ProxyTarget.fromInstance(this.database.database),
      secrets: [this.database.secret],
      vpc: props.vpc
    });
  }
}
