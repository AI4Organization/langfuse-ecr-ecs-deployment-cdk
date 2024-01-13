import { Platform } from 'aws-cdk-lib/aws-ecr-assets';

/**
 * Parses an array of platform strings and converts them into an array of Platform enums.
 * Supported platforms are LINUX_AMD64 and LINUX_ARM64.
 *
 * @param {string[]} platforms - The array of platform strings to parse.
 * @returns {Platform[]} An array of Platform enums.
 * @throws Will throw an error if an unsupported platform is encountered.
 */
export function parsePlatforms(platforms: string[]): Platform[] {
    console.log(`platforms: ${platforms}`);
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
