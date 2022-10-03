import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { AuthConfig } from './auth.config';
import { User } from './users/schemas/user.schema';
import {
  AuthenticationDetails,
  CognitoUser,
  CognitoUserPool,
  CognitoUserAttribute,
} from 'amazon-cognito-identity-js';

export interface TokenPayload {
  userId: string;
}

@Injectable()
export class AuthService {
  private userPool: CognitoUserPool;
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    @Inject('AuthConfig')
    private readonly authConfig: AuthConfig,
  ) {}

  async login(user: User, response: Response) {

    const tokenPayload: TokenPayload = {
      userId: user._id.toHexString(),
    };

    const expires = new Date();
    expires.setSeconds(
      expires.getSeconds() + this.configService.get('JWT_EXPIRATION'),
    );

    const token = this.jwtService.sign(tokenPayload);

    response.cookie('Authentication', token, {
      httpOnly: true,
      expires,
    });
  }
  async validateUser(email: string, password: string) {
    const authenticationDetails = new AuthenticationDetails({
      Username: email,
      Password: password,
    });
    const userData = {
      Username: email,
      Pool: this.userPool,
    };

    const newUser = new CognitoUser(userData);
    return new Promise((resolve, reject) => {
      return newUser.authenticateUser(authenticationDetails, {
        onSuccess: (result) => {
          resolve(result);
        },
        onFailure: (err) => {
          reject(err);
        },
      });
    });
    // const user = await this.usersRepository.findOne({ email });
    // const passwordIsValid = await bcrypt.compare(password, user.password);
    // if (!passwordIsValid) {
    //   throw new UnauthorizedException('Credentials are not valid.');
    // }
    // return user;
  }
  logout(response: Response) {
    response.cookie('Authentication', '', {
      httpOnly: true,
      expires: new Date(),
    });
  }
}
