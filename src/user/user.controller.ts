import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { buildResponse } from 'src/helpers/response';
import { CreateUserDto } from './dtos/CreateUser.dto';
import { UserServices } from './user.service';
import * as bcrypt from 'bcrypt';
import { JwtAuthGuard } from 'src/middlewares/jwt';

@Controller('users')
export class UserControllers {
  constructor(private userService: UserServices) {}

  @Post()
  @UsePipes(ValidationPipe)
  async createUser(@Body() createUserDto: CreateUserDto) {
    try {
      const usernameToLowerCase: string =
        createUserDto.username.toLocaleLowerCase();

      const users = await this.userService.getUserByUsername(
        createUserDto.username,
      );

      if (users) {
        return buildResponse(
          false,
          'Username ready',
          null,
          HttpStatus.CONFLICT,
        );
      }

      const passwordHash = await bcrypt.hash(createUserDto.password, 10);
      const newUser = await this.userService.createUser({
        ...createUserDto,
        username: usernameToLowerCase,
        password: passwordHash,
      });

      return buildResponse(
        true,
        'User created successfully',
        newUser,
        HttpStatus.CREATED,
      );
    } catch (error) {
      throw new HttpException(
        buildResponse(
          false,
          'Internal server error',
          error.message,
          HttpStatus.BAD_REQUEST,
        ),
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getUsers() {
    try {
      const users = await this.userService.getUsers();
      if (!users.length) {
        return buildResponse(true, 'Data empty', users, HttpStatus.NOT_FOUND);
      }
      return buildResponse(
        true,
        'User successfully',
        users,
        HttpStatus.CREATED,
      );
    } catch (error) {
      throw new HttpException(
        buildResponse(
          false,
          'Internal server error',
          error.message,
          HttpStatus.BAD_REQUEST,
        ),
        HttpStatus.BAD_REQUEST,
      );
    }
  }
  @Get(':username')
  @UseGuards(JwtAuthGuard)
  async getUserByUsername(@Param('username') username: string) {
    try {
      const user = await this.userService.getUserByUsername(username);
      if (!user) {
        return buildResponse(
          false,
          'User not found',
          null,
          HttpStatus.NOT_FOUND,
        );
      }

      return buildResponse(
        true,
        'User retrieved successfully',
        user,
        HttpStatus.OK,
      );
    } catch (error) {
      throw new HttpException(
        buildResponse(
          false,
          'Internal server error',
          error.message,
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete()
  async deleteAllUsers() {
    try {
      await this.userService.deleteAllUsers();

      return buildResponse(
        true,
        'Delete All successfully',
        null,
        HttpStatus.OK,
      );
    } catch (error) {
      throw new HttpException(
        buildResponse(
          false,
          'Internal server error',
          null,
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
