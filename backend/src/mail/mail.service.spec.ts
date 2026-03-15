import { Test, TestingModule } from '@nestjs/testing';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';

describe('MailService', () => {
  let service: MailService;
  let mailerService: any;
  let configService: any;

  beforeEach(async () => {
    mailerService = {
      sendMail: jest.fn().mockResolvedValue({ messageId: '123' }),
    };

    configService = {
      get: jest.fn().mockImplementation((key: string, defaultValue: string) => {
        if (key === 'FRONTEND_URL') return 'https://footdash.app/';
        return defaultValue;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        { provide: MailerService, useValue: mailerService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('sendPasswordResetEmail should call mailer with correct parameters', async () => {
    const email = 'test@example.com';
    const token = 'xyz-789';
    await service.sendPasswordResetEmail(email, token);

    expect(mailerService.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: email,
        subject: expect.stringContaining('Reset Your Password'),
        text: expect.stringContaining('https://footdash.app/auth/reset-password?token=xyz-789'),
        html: expect.stringContaining('https://footdash.app/auth/reset-password?token=xyz-789'),
      }),
    );
  });

  it('sendPasswordResetEmail should throw and log on failure', async () => {
    mailerService.sendMail.mockRejectedValue(new Error('SMTP Error'));
    
    await expect(service.sendPasswordResetEmail('a@b.com', 't'))
      .rejects.toThrow('SMTP Error');
  });

  it('should use default FRONTEND_URL if config returns undefined', async () => {
    // Re-initialize with different config
    const mockConfig = { get: jest.fn().mockReturnValue(undefined) };
    const mod = await Test.createTestingModule({
      providers: [
        MailService,
        { provide: MailerService, useValue: mailerService },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();
    
    const svc = mod.get<MailService>(MailService);
    // Trigger reset to see URL in text
    await svc.sendPasswordResetEmail('a@b.com', 'tok');
    
    expect(mailerService.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringContaining('http://localhost:4200'),
      }),
    );
  });
});
