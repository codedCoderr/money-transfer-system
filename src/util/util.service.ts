import { Injectable } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';

@Injectable()
export class UtilService {
  constructor(private jwtService: JwtService) {}

  generateRandom(length: number, chars?: string, isOTP?: boolean): string {
    let dict = chars;
    if (!chars) {
      dict = '0123456789';
      if (!isOTP) {
        dict += 'ABCDEFGHJKLMNOPQRSTUVWXYZ';
      }
    }

    let result = '';
    for (let i = length; i > 0; i -= 1) {
      result += dict[Math.round(Math.random() * (dict.length - 1))];
    }
    return result;
  }

  static unslug(slug: string): string {
    const words = slug.split('-');

    return words
      .map(
        (word) =>
          word.charAt(0).toUpperCase() + word.substring(1).toLowerCase(),
      )
      .join(' ');
  }

  signToJwtToken(
    params: string | Record<string, unknown> | Buffer,
    opts?: JwtSignOptions,
  ): string {
    return this.jwtService.sign(params as string, opts);
  }

  verifyJwtToken(token: string): any {
    return this.jwtService.verify(token);
  }

  trimAndLowerCase(value: string): string {
    return value ? value.trim().toLowerCase() : '';
  }

  generateUniqueEmail(): string {
    const domain = 'gmail.com';
    const username = this.generateRandom(10);
    const email = `${username}+random@${domain}`;
    return email;
  }

  generateUniquePhoneNumber(countryCode: string): string {
    const localNumber = this.generateRandom(10, undefined, true);
    const phoneNumber = `${countryCode}${localNumber}`;
    return phoneNumber;
  }
}
