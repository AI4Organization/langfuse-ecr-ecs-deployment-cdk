import { Platform } from 'aws-cdk-lib/aws-ecr-assets';

export function parsePlatforms(platforms: string[]): Platform[] {
    const platformList: Platform[] = [];
    for (const platform of platforms) {
        if (platform === 'LINUX_AMD64') {
            platformList.push(Platform.LINUX_AMD64);
        } else if (platform === 'LINUX_ARM64') {
            platformList.push(Platform.LINUX_ARM64);
        } else {
            throw new Error(`The platform ${platform} is not supported. Please choose from LINUX_AMD64, LINUX_ARM64.`);
        }
    }
    return platformList;
}