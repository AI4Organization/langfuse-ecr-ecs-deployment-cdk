import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ecrDeploy from 'cdk-ecr-deployment';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import { LangfuseDockerImageEcrDeploymentCdkStackProps } from './LangfuseDockerImageEcrDeploymentCdkStackProps';
import { LATEST_IMAGE_VERSION } from './langfuse-ecr-apprunner-deployment-cdk-stack';

export class LangfuseEcrEcsDeploymentCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: LangfuseDockerImageEcrDeploymentCdkStackProps) {
    super(scope, id, props);

    const ecrRepository = new ecr.Repository(this, `${props.appName}-${props.environment}-DockerImageEcrRepository`, {
      repositoryName: props.repositoryName,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      emptyOnDelete: true,
      encryption: ecr.RepositoryEncryption.AES_256
    });

    ecrRepository.addLifecycleRule({ maxImageAge: cdk.Duration.days(7), rulePriority: 1, tagStatus: ecr.TagStatus.UNTAGGED }); // delete images older than 7 days
    ecrRepository.addLifecycleRule({ maxImageCount: 4, rulePriority: 2, tagStatus: ecr.TagStatus.ANY }); // keep last 4 images

    const deployImageVersions = props.imageVersion === LATEST_IMAGE_VERSION ? [props.imageVersion] : [props.imageVersion, LATEST_IMAGE_VERSION];
    for (const deployImageVersion of deployImageVersions) {
      // copy from docker registry to ECR
      new ecrDeploy.ECRDeployment(this, `${props.appName}-${props.environment}-${deployImageVersion}-ECRDeployment`, {
        src: new ecrDeploy.DockerImageName('ghcr.io/langfuse/langfuse:latest'),
        dest: new ecrDeploy.DockerImageName(`${ecrRepository.repositoryUri}:${deployImageVersion}`),
      });
    }

    // print out ecrRepository arn
    new cdk.CfnOutput(this, `${props.appName}-${props.environment}-ECRRepositoryArn`, {
      value: ecrRepository.repositoryArn,
      exportName: `${props.appName}-${props.environment}-ECRRepositoryArn`,
    });

    // print out ecrRepository repository name
    new cdk.CfnOutput(this, `${props.appName}-${props.environment}-ECRRepositoryName`, {
      value: ecrRepository.repositoryName,
      exportName: `${props.appName}-${props.environment}-ECRRepositoryName`,
    });
  }
}
