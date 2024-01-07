import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ecrDeploy from 'cdk-ecr-deployment';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import { LangfuseEcrStackProps } from './LangfuseEcrStackProps';
import { LATEST_IMAGE_VERSION } from '../bin/langfuse-ecr-ecs-deployment-cdk';

/**
 * Represents a CDK stack for deploying Docker images to an Amazon ECR repository.
 * This stack creates an ECR repository, sets up lifecycle rules for image retention,
 * and handles the deployment of specified image versions from a Docker registry to ECR.
 */
export class LangfuseEcrDeploymentCdkStack extends cdk.NestedStack {
  /**
   * The ECR repository where Docker images are stored.
   * @public
   * @type {cdk.aws_ecr.Repository}
   */
  public readonly ecrRepository: cdk.aws_ecr.Repository;

  /**
   * Constructs a new instance of the LangfuseEcrDeploymentCdkStack class.
   * @param {Construct} scope - The scope in which to define this construct.
   * @param {string} id - The scoped construct ID. Must be unique amongst siblings in the same scope.
   * @param {LangfuseEcrStackProps} props - The stack properties.
   */
  constructor(scope: Construct, id: string, props: LangfuseEcrStackProps) {
    super(scope, id, props);

    this.ecrRepository = new ecr.Repository(this, `${props.appName}-${props.environment}-DockerImageEcrRepository`, {
      repositoryName: props.repositoryName,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      emptyOnDelete: true,
      encryption: ecr.RepositoryEncryption.AES_256
    });

    this.ecrRepository.addLifecycleRule({ maxImageAge: cdk.Duration.days(7), rulePriority: 1, tagStatus: ecr.TagStatus.UNTAGGED }); // delete images older than 7 days
    this.ecrRepository.addLifecycleRule({ maxImageCount: 4, rulePriority: 2, tagStatus: ecr.TagStatus.ANY }); // keep last 4 images

    const deployImageVersions = props.imageVersion === LATEST_IMAGE_VERSION ? [props.imageVersion] : [props.imageVersion, LATEST_IMAGE_VERSION];
    for (const deployImageVersion of deployImageVersions) {
      // copy from docker registry to ECR
      new ecrDeploy.ECRDeployment(this, `${props.appName}-${props.environment}-${deployImageVersion}-ECRDeployment`, {
        src: new ecrDeploy.DockerImageName('ghcr.io/langfuse/langfuse:latest'),
        dest: new ecrDeploy.DockerImageName(`${this.ecrRepository.repositoryUri}:${deployImageVersion}`),
      });
    }

    // print out ecrRepository arn
    new cdk.CfnOutput(this, `${props.appName}-${props.environment}-ECRRepositoryArn`, {
      value: this.ecrRepository.repositoryArn,
      exportName: `${props.appName}-${props.environment}-ECRRepositoryArn`,
    });

    // print out ecrRepository repository name
    new cdk.CfnOutput(this, `${props.appName}-${props.environment}-ECRRepositoryName`, {
      value: this.ecrRepository.repositoryName,
      exportName: `${props.appName}-${props.environment}-ECRRepositoryName`,
    });
  }
}
