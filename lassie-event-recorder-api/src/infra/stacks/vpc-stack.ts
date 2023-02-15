import { Construct } from "constructs";
import { Stack, StackProps } from "aws-cdk-lib";
import { InterfaceVpcEndpointAwsService, SubnetType, Vpc } from "aws-cdk-lib/aws-ec2";

interface VpcStackProps extends StackProps {
    prefix: string
}

export class VpcStack extends Stack {
  readonly vpc: Vpc

  constructor(scope: Construct, id: string, props: VpcStackProps) {
    super(scope, id, props);

    // All resources should be in this VPC
    this.vpc = new Vpc(this, "Vpc", {
      natGateways: 0,
      maxAzs: 3,
      subnetConfiguration: [
        {
          name: `${props.prefix}-PublicSubnet`,
          subnetType: SubnetType.PUBLIC
        },
        {
          name: `${props.prefix}-PrivateSubnet`,
          subnetType: SubnetType.PRIVATE_ISOLATED
        }
      ],
      vpcName: `${props.prefix}-Vpc`
    });

    // So that our lambdas can access secrets manager from within the private subnet
    this.vpc.addInterfaceEndpoint("SecretsManagerEndpoint", {
      service: InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
    });
  }
}
